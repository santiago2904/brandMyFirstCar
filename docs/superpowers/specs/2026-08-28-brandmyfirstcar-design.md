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
- Subasta real: depósito del 20% (mín. equivalente a €10) al pujar, cobrado vía
  Lemon Squeezy (Merchant of Record — necesario porque Stripe no admite comercios en
  Colombia).
- Refund automático (vía API de Lemon Squeezy) cuando a alguien lo superan en la puja.
- Cobro del saldo restante al ganador cuando cierra la subasta (1 semana desde el launch).
- Muro de sponsors aprobados (logo + link), con aprobación manual del usuario.
- FAQ + "cómo funciona" (calcado del patrón de las referencias).
- Countdown a fin de subasta.

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
- **Server Actions / Route Handlers**: crear puja, validar incremento mínimo (+€10 sobre
  la actual), disparar refund al líder anterior, disparar checkout del saldo al ganador
  al cerrar la subasta.
- **Webhooks**: Lemon Squeezy → Route Handler que confirma pago de depósito y actualiza
  estado de la puja.

## 4. Modelo de datos

```
spots
  id, zone_name, size (S/M/L), starting_price,
  current_bid, current_leader_sponsor_id

bids
  id, spot_id, sponsor_id, amount, deposit_paid (bool),
  lemon_squeezy_order_id, status (active/outbid/refunded/won)

sponsors
  id, brand_name, email, logo_url, website, approved (bool)

campaign
  start_date, end_date (auction, 1 semana),
  sponsor_exposure_months (6)
```

## 5. Zonas del carro (placeholders — ajustar con datos reales antes de lanzar)

| Zona | Tamaño | Precio de arranque |
|---|---|---|
| Capó | L | €300 |
| Puerta izquierda | L | €300 |
| Puerta derecha | L | €300 |
| Baúl / trunk | M | €180 |
| Parachoques trasero | M | €180 |
| Espejos/detalle (opcional) | S | €90 |

Incremento mínimo de puja: +€10 sobre la puja actual.

## 6. Páginas / secciones

1. Hero: foto del carro + historia corta ("por qué este carro importa").
2. Selector de zonas con puja en vivo por spot (estado: disponible / liderando / outbid).
3. "Cómo funciona" (3 pasos, patrón BrandMyMac).
4. FAQ (pagos, qué pasa si te superan, aprobación de marca, por qué Lemon Squeezy).
5. Muro de sponsors aprobados.
6. Countdown a fin de subasta.

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
