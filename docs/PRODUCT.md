# Papaya Express

**Register:** product

## Qué es

Aplicación de pedidos para restaurantes y comercios del Perú, sobre todo en Tarapoto, Moyobamba y Lima. Tres formas de usarla, un mismo código:

- **Delivery**: el cliente indica su dirección, ve los comercios que llegan a su zona y pide.
- **Carta por QR**: el cliente escanea el código de su mesa y pide desde el local, sin mozo.
- **Tienda en línea por restaurante**: el mismo flujo servido bajo la marca de cada comercio, en `express.papaya.com.pe`.

Hay dos aplicaciones hermanas fuera de este repositorio, la del mozo y la del repartidor, y un punto de venta heredado, POS Restobar, donde el restaurante administra su carta.

## Para quién

- **El cliente que pide.** Casi siempre desde el teléfono, en la calle, con una mano, a veces con sol directo y con datos móviles lentos. En la web, en cambio, la mayoría entra desde escritorio.
- **El restaurante**, que confirma y despacha desde el punto de venta.
- **El repartidor**, que solo aparece en la app del cliente como estado y ubicación en el mapa.

## Principios

1. **Ver antes de registrarse.** El visitante indica dirección y ve comercios sin crear cuenta. El registro se pide al confirmar el pedido, no antes: adelantarlo pierde clientes.
2. **El estado del pedido nunca miente.** Si un paso no puede ocurrir, no se muestra. Un paso apagado para siempre hace ver el pedido atascado.
3. **Nada se queda cargando.** Toda espera tiene límite y toda falla tiene un camino de salida escrito en español claro.
4. **La imagen que falta no se muestra.** Ni ícono roto ni hueco.
5. **Funciona con la red mala.** El mapa, las fotos y las notificaciones son mejoras, no requisitos: si fallan, se puede pedir igual.

## Tono

Español peruano neutro, de tú. Frases cortas, verbos concretos. El botón dice lo que va a pasar. Los errores dicen qué pasó y qué hacer, sin disculpas ni tecnicismos.

## Anti referencias

- Nada de modo oscuro en las pantallas del cliente: se usa a plena luz.
- Nada de emojis como iconografía.
- Nada de tarjetas idénticas repetidas hasta el infinito, que es donde estaba la app antes.
- Nada de texto en peso 100 sobre gris: no se lee afuera.
