-- Fix A (pulizia) · Rimuove gli overload OBSOLETI di fn_book_appointment.
--
-- Migrazioni precedenti (0001 init, 0006 first_visit) avevano creato versioni a
-- 9 e 10 argomenti di fn_book_appointment, con la LOGICA VECCHIA (staff NULL non
-- smistato, nessun controllo conflitti "qualsiasi barbiere"). La 0063 ha corretto
-- solo la versione a 11 argomenti (quella usata dall'app via named params).
-- Lasciare in giro gli overload vecchi è rischioso (ambiguità + bug latente):
-- li eliminiamo, resta solo la versione a 11 argomenti corretta.

DROP FUNCTION IF EXISTS fn_book_appointment(text, text, text, text, uuid, uuid, timestamptz, text, boolean, boolean);
DROP FUNCTION IF EXISTS fn_book_appointment(text, text, text, text, uuid, uuid, timestamptz, text, boolean);
