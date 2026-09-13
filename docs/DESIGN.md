# Diseño de Papaya Express

Valores tomados del código, no inventados. Angular 14 con Material, Bootstrap heredado y siete hojas de estilo propias.

## Color

Estrategia: **restringida**. Neutros teñidos hacia el azul de marca, el naranja como único acento, por debajo del diez por ciento de la superficie.

| Rol | Valor | Dónde |
|---|---|---|
| Índigo de marca | `#3F51B5` | Cabeceras, degradado, iconografía primaria |
| Azul de marca | `#0064BF` | Extremo bajo del degradado |
| Naranja acento | `#E0651F` | Llamadas a la acción, paso activo, avisos |
| Dorado de noche | `#F3C56E` | Solo en la escena día/noche de la tarjeta de delivery |
| Tinta | `#1E2437` | Títulos y texto principal |
| Tinta azul | `#10395F` | Títulos sobre cielo claro |
| Texto secundario | `#6c757d` | Descripciones |
| Superficie | `#FFFFFF` | Tarjetas |
| Lienzo | `#F5F7FB` | Fondo de página |
| Borde suave | `#DDE2EC` | Contornos y separadores |

El degradado de marca es `linear-gradient(0deg, #0064BF 0%, #3F51B5 100%)`.

## Tipografía

Ubuntu en 300, 400, 500 y 700, con `Helvetica Neue, Arial, sans-serif` de respaldo. Nunca peso 100 en texto que deba leerse. Escala en uso: 26 y 25 para saludos, 19 para título de tarjeta grande, 16 y 15 para títulos de fila, 13 para descripciones, 12 para pie.

## Superficies

Tarjeta blanca, radio 10 en listados y 16 a 20 en tarjetas grandes, pastillas y chips en 8, sombra `0 1px 3px rgba(16,24,64,.10), 0 6px 16px rgba(16,24,64,.06)`. Nada de tarjetas anidadas. Nada de franjas de color al costado.

## Estructura

Columna centrada de 520 como máximo, porque en web la mayoría entra desde escritorio. Las bandas de color van a todo el ancho y su contenido dentro de la columna. Barra inferior fija con área segura del teléfono.

## Movimiento

Solo opacidad y transformación. Curvas de salida, sin rebote. Todo se detiene con `prefers-reduced-motion`. La escena de la tarjeta de delivery corre en tres capas a distinta velocidad y cambia de día a noche en un ciclo de dieciséis segundos.

## Reglas duras

- Área táctil mínima de 44.
- Sin desplazamiento horizontal en ningún ancho entre 360 y 1440.
- Imagen de producto que falla: no se muestra. Logo de comercio que falla: marcador de posición.
- Iconos en SVG en línea. Font Awesome es herencia y no se amplía.
