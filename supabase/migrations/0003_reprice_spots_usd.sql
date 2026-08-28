-- Reprice placeholder zones in USD, starting at $10 so the entry bid makes sense.
update spots set starting_price = 100 where zone_name = 'Capó';
update spots set starting_price = 100 where zone_name = 'Puerta izquierda';
update spots set starting_price = 100 where zone_name = 'Puerta derecha';
update spots set starting_price = 40 where zone_name = 'Baúl';
update spots set starting_price = 40 where zone_name = 'Parachoques trasero';
update spots set starting_price = 10 where zone_name = 'Espejos';
