import { createPreference, getPaymentDetails } from "../services/mp.service.js";

//Creamos un pago
export const createPayment = async (req, res, next) => {
  try {
    //Lista de productos (array en este caso pero podria ser un producto aislado) enviados via Body.
    const products = req.body;

    //Creamos la preferencia de pago (orden con todos los datos de la transaccion y el usuario)
    const preference = await createPreference(products);

    //Retornamos un id y el init_point (Link de MP para realizar el pago)
    res.json({ id: preference.id, init_point: preference.init_point });
  } catch (error) {
    next(error);
  }
};

// Metodo que ejecuta MP para enviar notificaciones al servidor sobre el estado de la transaccion (aprobado, pendiente, rechazado)
export const handleWebhook = async (req, res, next) => {
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
  } catch (error) {
    next(error);
  }
};
