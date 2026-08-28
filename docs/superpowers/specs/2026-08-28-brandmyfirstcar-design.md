# brandMyFirstCar — Design Spec

Fecha: 2026-08-28
Autor: Santiago (spalacio@blossom.technology) + Claude

## 1. Qué es

Landing con subasta en vivo, inspirada en brandmymac.com y sponsormyvan.com: sponsors
pujan por espacios de sticker/logo en el primer carro real del usuario. El ganador de
cada zona paga y su marca viaja físicamente en el carro durante 6 meses, con visibilidad
en fotos/redes del usuario.

## 2. Alcance v1

**Incluido:**
- Landing pública multi-idioma (ES/EN) con selector de zonas del carro y puja en vivo.
- Subasta real: depósito del 20% (mín. $2 USD — bajado desde $10 al reprecificar las
  zonas en USD, para que el piso no se comiera el 20% real en las ofertas chicas) al
  pujar, cobrado vía
  Lemon Squeezy (Merchant of Record — necesario porque Stripe no admite comercios en
  Colombia).
- Refund automático (vía API de Lemon Squeezy) cuando a alguien lo superan en la puja.
- Cobro del saldo restante al ganador cuando cierra la subasta (1 semana desde el launch).
- Muro de sponsors aprobados (logo + link), con aprobación manual del usuario.
- FAQ + "cómo funciona" (calcado del patrón de las referencias).
- Countdown a fin de subasta.
- Sección "Qué más te llevás" con 3 beneficios extra (no automatizables, solo copy):
  1. Trabajo de software dev atribuible al monto pagado (web, app, automatización o bot).
  2. Contenido en redes sociales del carro (el auto brandeado se ve orgánicamente).
  3. Videollamada por FaceTime para mostrar el carro cuando lo tenga (opcional, a pedido del sponsor).

**Fuera de alcance v1 (YAGNI):**
- Panel de admin con UI — aprobación de sponsors se hace directo en Supabase.
- Dashboard de analytics/impresiones.
- Más idiomas que ES/EN (arquitectura lo permite, contenido no).
- Pago con otros métodos fuera de lo que ofrezca Lemon Squeezy.

## 3. Arquitectura

- **Frontend/backend**: Next.js (App Router) + Vercel.
- **i18n**: `next-intl`, locales `es` (default) y `en`, diccionarios JSON por idioma.
- **DB**: Supabase (Postgres).
- **Pagos**: Lemon Squeezy (Merchant of Record — cobra en nombre del usuario, maneja
  impuestos/compliance, paga al usuario en Colombia vía transferencia/PayPal).
  - **Nota técnica**: Lemon Squeezy no soporta authorization holds diferidos como Stripe.
    El depósito se cobra completo al pujar; si superan la puja, se dispara un **refund
    real** vía su API (no liberación de hold). Funcionalmente igual para el sponsor.
- **Server Actions / Route Handlers**: crear puja, validar incremento mínimo (+$10 sobre
  la actual), disparar refund al líder anterior, disparar checkout del saldo al ganador
  al cerrar la subasta.
- **Webhooks**: Lemon Squeezy → Route Handler que confirma pago de depósito y actualiza
  estado de la puja.

## 4. Modelo de datos

```
spots
  id, zone_name, size (S/M/L), starting_price,
  current_bid, current_leader_sponsor_id, bid_count

bids
  id, spot_id, sponsor_id, amount, deposit_paid (bool),
  lemon_squeezy_order_id, status (active/outbid/refunded/won)

sponsors
  id, brand_name, email, logo_url, website, approved (bool)

campaign
  start_date, end_date (auction, 1 semana),
  sponsor_exposure_months (6)

site_stats
  id (=1), total_visits (bigint, incrementado vía función RPC increment_visits()
  en cada carga de página — contador simple sin deduplicación de bots/refreshes)
```

## 5. Zonas del carro (placeholders — ajustar con datos reales antes de lanzar)

| Zona | Tamaño | Precio de arranque |
|---|---|---|
| Capó | L | $100 |
| Puerta izquierda | L | $100 |
| Puerta derecha | L | $100 |
| Baúl / trunk | M | $40 |
| Parachoques trasero | M | $40 |
| Espejos/detalle (opcional) | S | $10 |

Incremento mínimo de puja: +$10 sobre la puja actual. Meta de financiamiento total
mostrada en el hero: $12,000 USD.

## 6. Páginas / secciones

1. Nav fija + stats bar (visitas totales acumuladas + gente viendo la página ahora,
   vía Supabase Realtime Presence — efímero, no persistido).
2. Hero: foto del carro + historia corta ("por qué este carro importa") + barra de
   progreso de financiamiento ($ ofertado hasta ahora / meta de $12,000 USD).
3. Modelo 3D del carro (Three.js/react-three-fiber, procedural — sin asset externo),
   con badges HTML anclados por zona: muestran el logo del sponsor líder si existe, o
   el precio actual. Solo vista/rotación (drag), no es una segunda vía para pujar —
   pujar sigue siendo a través de la tabla.
4. Selector de zonas con puja en vivo por spot: columnas Zona / Líder (logo + nombre
   del sponsor actual, o "—") / Oferta actual (+ cantidad de ofertas) / acción. Modal
   animado (fade+scale) con desglose de depósito y upload opcional de logo (Supabase
   Storage, bucket público `sponsor-logos`, subido vía server action con service
   role — sin políticas RLS de escritura pública necesarias).
5. Banner de confirmación post-pago: Lemon Squeezy redirige de vuelta al sitio
   (`product_options.redirect_url`) a `/{locale}?bid=confirmed` en vez de dejar al
   sponsor en la página de "my orders" de Lemon Squeezy.
6. "Cómo funciona" (3 pasos, patrón BrandMyMac).
7. FAQ (pagos, qué pasa si te superan, aprobación de marca, por qué Lemon Squeezy).
8. Muro de sponsors aprobados.
9. Countdown a fin de subasta.

## 7. Testing

Liviano, no TDD estricto. Tests solo en lógica con plata real:
- Cálculo de incremento mínimo de puja.
- Trigger de refund al superar a un líder.
- Cálculo de saldo restante al cerrar subasta.
UI y páginas estáticas sin cobertura de test dedicada.

## 8. Riesgos conocidos

- Lemon Squeezy está pensado para productos digitales/suscripciones, no subastas
  dinámicas — el flujo de "depósito + refund + cobro de saldo" se arma sobre su API de
  checkout + refunds, no es un patrón nativo de la plataforma. Validar límites de su
  API antes de implementar el flujo de refund automático.
- Aprobación manual de sponsors es un paso humano — si el volumen crece, se vuelve
  cuello de botella (aceptable para v1).
- El modelo 3D del carro es genérico/procedural (cajas y cilindros), no el carro real —
  las posiciones de zona son coordenadas aproximadas a ojo. Reemplazar por un modelo
  real (o al menos texturizado con fotos) antes de que importe la fidelidad visual.
- **Gap de seguridad pendiente, no introducido hoy pero notado en este cambio**: las
  tablas `spots`, `bids`, `sponsors`, `campaign` no tienen Row Level Security
  habilitada — el anon key del cliente puede leer (y en teoría escribir) esas tablas
  directamente vía la API REST de Supabase, sin pasar por `placeBid`. Las escrituras
  reales del sitio sí van todas por server actions con service role, pero nada del
  lado de la base de datos impide que alguien más escriba directo. Aceptable para un
  MVP de bajo volumen; agregar políticas RLS (o al menos revocar INSERT/UPDATE para
  el rol `anon`) antes de un lanzamiento con tráfico real.
