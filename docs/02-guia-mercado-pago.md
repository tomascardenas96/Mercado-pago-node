# 🧾 Guía para integrar Mercado Pago en tu proyecto Node.js (Checkout Pro)

Mercado Pago ofrece distintos tipos de integracion para procesar pagos en tu proyecto, en esta guia nos centraremos en Checkout Pro (mas simple que Checkout API pero menos flexible).

<br>

## 🛠️ Requisitos previos

- Tener una cuenta en Mercado Pago (Misma que Mercado Libre) [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/es)

<br>

# 📁 Desde la pagina de Mercado Pago Developers

## Crear tu aplicación en Mercado Pago

1. Ingresa al [panel de desarrolladores](https://www.mercadopago.com.ar/developers/panel)
2. Hacé clic en **"Crear aplicación"**
3. Asignale un nombre a la aplicacion y completa el resto de campos.

- ¿Que tipo de solucion de pago vas a integrar?: Seleccionar **Pagos online**.
- ¿Estas usando una plataforma de e-commerce?: Selecciona la opcion **No**.
- ¿Qué producto estás integrando?: Selecciona CheckoutPro.
- Click en **Crear Aplicacion**.

4. Ingresa a la aplicacion recien creada.
5. Dentro del dashboard de la aplicacion, dirigirse a 'Cuentas de prueba'.

- Alli deberas crear 2 cuentas de prueba (1 para simular un comprador y 1 simular un vendedor).
- Guarda el usuario y contraseña de ambas cuentas de prueba.

6. Cerra sesion en tu cuenta actual e ingresa con el vendedor de prueba.
7. Dirigirse a **Tus Integraciones** (igual al paso anterior pero esta vez desde la cuenta de prueba del vendedor).
8. Nuevamente crear una aplicacion (Podes ponerle el mismo nombre ej: velo-test).
9. Ingresa al dashboard de la aplicacion creada.
10. Seleccionar la opcion 'Credenciales de prueba'

- Copiar el Access Token y guardarlo en algun lugar seguro (Este access token es para hacer pruebas).
- Guardar tambien la Public Key (será utilizada en el Frontend).

<br>

# 📁 En tu proyecto Node.js

## Instala las dependencias necesarias:

```bash
npm install mercadopago dotenv
```

(El sdk de mercadopago y dotenv sirve para leer las variables de entorno)

<br>

## Crear un archivo .env en la raiz del proeyecto y agregalo al archivo .gitignore (para que no se suban las credenciales a github).

```env
MP_ACCESS_TOKEN=TU_ACCESS_TOKEN_DE_PRUEBA
PORT=3000
FRONTEND_URL=https://localhost:5173
TUNNEL_HOST=LOCALHOST_HTTPS_CON_NGROK_ACTIVO
```

Modifica estos datos con la informacion anteriormente guardada.

<br>

## Agregar el archivo ngrok.exe

- Ingresar a la web de [ngrok](https://ngrok.com/)
- Registrarse e iniciar sesion
- Descargar archivo ngrok.exe y agregarlo en la raiz de tu proyecto
- Abrir la terminal en la ruta raiz de tu proyecto y ejecutar el comando de configuracion que te da la pagina de ngrok (ngrok config add-authtoken <TU_TOKEN>)

<br>

## Creamos las 2 rutas necesarias (para crear la preferencia y para recibir el webhook - notificaciones enviadas por MercadoPago con el estado de la transaccion)

```javascript
import express from "express";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { config } from "dotenv";
config(); //IMPORTANTE Para leer las variables de entorno (.env)

const app = express();
app.use(express.json());

// Configuracion principal de Mercado Pago.
export const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN, //Agregar aca el access token desde el archivo .env
});

// Ruta para crear preferencia (se crea una transaccion con los datos proporcionados)
app.post("/create_preference", async (req, res) => {
  try {
    const preference = new Preference(client);
    const products = req.body;
    //Agregar validaciones para que no se pasen datos incorrectos desde el cliente.

    const result = await preference.create({
      body: {
        items: products.map((product) => {
          return {
            title: product.title,
            quantity: Number(product.quantity),
            unit_price: Number(product.unit_price),
          };
        }),
        currency_id: "ARS",
        back_urls: {
          success: `${process.env.FRONTEND_URL}/success`, //Este campo tiene que ser https (https://localhost:3000)
          failure: `${process.env.FRONTEND_URL}/failure`,
          pending: `${process.env.FRONTEND_URL}/pending`,
        },
        auto_return: "approved",
        notification_url: `${process.env.TUNNEL_HOST}/api/payment/webhook`,
      },
    });

    res.json({ init_point: result.init_point });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al crear preferencia");
  }
});

app.post("/webhook", (req, res) => {
  try {
  //Mercado pago devuelve el type y el id de la transaccion por query y por body, obtenemos ambos para asegurarnos que lleguen los datos de manera consistente.
    const queryType = req.query.type;
    const queryId = req.query["data.id"];
    const bodyType = req.body.type;
    const bodyId = req.body?.data?.id;

    //Definimos las variables de Type y Id ya sea con datos llegados por Query o por el Body.
    const type = queryType || bodyType;
    const id = queryId || bodyId;

    //Mercado pago devuelve la respuesta varias veces, por eso solo debemos proceder cuando el tipo de la transaccion es "payment" y cuando existe el id.
    if (type === "payment" && id) {
      const result = await getPaymentDetails(id);

      if (result.status === "approved") {
        console.log("El pago fue aprobado con exito");

        //Agregar acá logica extra (como restar stock, reservar un vuelo, etc.).
      } else if (result.status === "rejected") {
        console.log("El pago ha sido rechazado");

        //Agregar logica de pago fallido en caso de ser necesario.
      } else if (result.status === "in_process") {
        console.log("El pago esta pendiente...");
      }
    }

    //IMPORTANTE: Mercado Pago espera recibir una confirmacion de que la notificacion fue recibida correctamente, por eso le enviamos un codigo de estado 200.
    res.sendStatus(200);
  } catch {
    console.error(error);
    res.status(500).send("Error al recibir el webhook");
  }
});

//Funcion que llama a la API de Mercado pago por medio de un ID para obtener los datos detallados de la transaccion.
export async function getPaymentDetails(id) {
  const token = process.env.MP_ACCESS_TOKEN;

  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
    }
  );
  return response.json();
}

app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${process.env.PORT}`);
});
```

NOTA: (Este ejemplo se simplifico guardando todo en el archivo principal, seria recomendable crear distintos archivos para cada tarea - ruta, servicio, controlador).

<br>

## Crear un tunnel HTTPS de tu localhost (http => https)

- Abrir una terminal cmd (algunas terminales como git bash no funcionan) desde la ruta raiz.
- Ejecutar el comando ngrok http 3000 (o el puerto en el que tengas corriendo el backend).

```bash
ngrok http 3000
```

- Copiar la url generada (columna 'Forwarding') y guardarla en una variable de entorno (como se muestra en el punto anterior).

```cpp
https://9b12-190-123-123-1.ngrok.io
```

- Dejar abierta la terminal donde se ejecuta Ngrok.
- NOTA: La URL generada es dinamica, por lo tanto cada vez que corras el comando te dara una nueva URL (y deberas agregarla nuevamente a la variable de entorno).

<br>

## Correr el proyecto en una nueva terminal

```bash
npm run dev
```

<br>

## Realizar pruebas

- Hace un POST a `/create_preference` con esta estructura en el body:

```json
[
  {
    "description": "Curso de Node.js",
    "unit_price": 1500,
    "quantity": 1
  }
]
```

- Recibís un init_point (URL para pagar).
- Abrí esa URL en el navegador y usá datos de prueba para completar el pago (abrir cuenta de prueba de comprador anteriormente generada en Mercado Pago).
- NOTA: Podes usar tarjetas de prueba para simular los distintos estados de la transaccion - [Tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/test/cards)

<br>

## Verificar la consola de Node.js para confirmar que se reciben los webhooks (notificacion con estado de la compra).

- Si recibis una respuesta, quiere decir que quedo correctamente configurado
