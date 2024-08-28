// modules
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const pdf = require("pdf-parse");
// files
const { Invoices } = require("../database/mongo/models/invoices");
const sendNewRelicEvent = require("../lib/newrelic/");
const { Funcs } = require("../lib/misc/funcs");
const { Properties } = require("../database/mongo/models/properties");
const { Credentials  } = require("../database/mongo/models/credentials");

module.exports.createInvoice = async (data) => {
  let responseX = {
    status: "error",
    code: 400,
    message: "Malformed payload",
  };
 
 
  const Credential = await Credentials.findByType("gmail");

  let token = await generarToken(Credential);

  if(token.code!=200){
    responseX.status="failed";
    responseX.code = 401;
    responseX.message =  "Refresh Token expired";
    return responseX;
  } //  tokenNew
  
  const { client_id, client_secret, redirect_uris } = Credential.access.gmail;

  let responseEmails = {
    status: "init",
    message: "",
    ids:[]
  };

  try {
    
    // Configura el cliente OAuth2
    const oauth2Client = new google.auth.OAuth2(
      client_id, // Reemplaza con tu Client ID
      client_secret, // Reemplaza con tu Client Secret
      redirect_uris // Reemplaza con tu Redirect URI
    );

    // Establece el token de acceso
    let tokens = {
       refresh_token : Credential.access.gmail.refresh_token,
       access_token : token.tokenNew
    }
    oauth2Client.setCredentials(tokens);

    // Crea una instancia de Gmail API
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Lista los mensajes
    const response = await gmail.users.messages.list({
      userId: "me", // 'me' se refiere al usuario autenticado
      labelIds: ["INBOX"],
      maxResults: 50, // Número máximo de mensajes a recuperar
    });

    const messages = response.data.messages || [];
    console.log(1, messages.length);
    if (messages.length) {
      //console.log("Mensajes:");
      responseEmails.count = messages.length;
      let idTemp = [];

      for (const message of messages) {
        responseEmails.message = "processing";
        const msg = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
        });

        const headers = msg.data.payload.headers;
        
        /*
        const fromHeader = headers.find((header) => header.name === "From");
        if (fromHeader) {
          console.log(`Remitente encontrado => Mensaje ID: ${message.id}`);
          let correo = extractEmails(fromHeader.value);
        } else {
          console.log(`Remitente no encontrado => Mensaje ID: ${message.id}`); 
          break;
        }*/

        const subjectHeader = headers.find(
          (header) => header.name === "Subject"
        );

        let property = await Properties.findByName(subjectHeader.value);

        if (property == null) {
          console.log(2, "subject no hace match with our DB rows: " );
          idTemp.push({ error: "subject no hace match with our DB rows: " , id: message.id, status: "failed" });
          break;
        }

        const hasAttachments =  msg.data.payload.parts &&  msg.data.payload.parts.some( (part) => part.filename && part.body.attachmentId );
        // aca si cumple todo
        if (hasAttachments) {
          console.log(3, "  attach" );
         // console.log(`Mensaje con archivo adjunto: ${msg.data.snippet}`);
          msg.data.payload.parts.forEach(async (part) => {
            if (part.filename && part.body.attachmentId) {
             // console.log(`Archivo encontrado: ${part.filename}`);
             console.log(4, "  part.body.attachmentId" );
              try {
                const response = await gmail.users.messages.attachments.get({
                  userId: "me",
                  messageId: message.id,
                  id: part.body.attachmentId,
                });
                console.log(4.1, "  gmail.users.messages.attachments.get  " );

                const data = response.data.data;
                console.log(4.2, "  data  " );
                const buffer = Buffer.from(data, "base64");
                console.log(4.3, "  buffer  " );
               // fs.writeFileSync(`${part.filename}`, buffer);
                console.log(8.1, 'writeFileSync');  
                let dataFile = buffer;
                let dataPdf = await Funcs.getDataFromBuffer(dataFile);
            
                if (dataPdf.length > 0) {
                  let dataBase = Funcs.makeFiels(dataPdf, property.fields);
                   console.log(8.2, dataBase);
                  // inssert DB
                  const today = new Date();
                  let dbBill = {
                    ...dataBase,
                    idProperty: property._id,
                    correo : dataPdf,
                    activeRecord: true,
                    createdAt: today,
                    updatedAt: today
                  };
                  //insertar eb BD incoives
                  await Invoices.insert(dbBill);
            
                  // insert New Relic
                  /*await sendNewRelicEvent({
                    ...dataBase,
                    eventType: "DemoInvoices",
                  });*/

                  idTemp.push({ error: "" , id: message.id, status: "Done" });
                } else {
                  console.log(5, "  File and data was processed empty" );
                  idTemp.push({ error: "File and data was processed empty" , id: message.id, status: "Done" });
                }

                //leido y archivo // ademas eliminamos el file creado
                await moveEmailsByLabels(gmail, message, ["INBOX", "UNREAD"]);
                //removeFile(part);
                ///--------------------------------------------------------------
              } catch (error) {
                console.log(5, "Error al descargar el archivo adjunto"+ error.response ? error.response.data : error.message );
                idTemp.push({ error: "Error al descargar el archivo adjunto"+error.response ? error.response.data : error.message , id: message.id, status: "Fail" });
              }
            }
          });
        } else {
          console.log(6, "not Attach File" );
          //archivamos el correo para no leerlo de nuevo 
          await moveEmailsByLabels(gmail, message, ["INBOX"]);
          idTemp.push({ error: "not Attach File " , id: message.id, status: "failed" });
        }
      }
      responseEmails.ids = idTemp;
      responseEmails.message  = "finish";
    } else {
      responseEmails.status = "cero mensajes";
    }
  } catch (error) {
    responseX.status = "Failed";
    responseX.message =  "ERROR: al leer los mensajes => " + error.response ? error.response.data : error.message;
    responseX.code = 500;
  }
  responseX.emails = responseEmails;
  responseX.code = 200;
  responseX.status = "Success";
  responseX.message = "End Process";
  return responseX;
};



async function leerPdf(file, type) {
  // Lee el archivo PDF
  const filePath = file; // Reemplaza con la ruta a tu archivo PDF

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error("Error al leer el archivo PDF:", err);
      return;
    }

    // Extrae texto del PDF
    pdf(data)
      .then(async (result) => {
        //console.log('Texto extraído del PDF:');
        let dataBase1 = {};
        let datos = result.text.split("\n");
        switch (type) {
          case 1:
            dataBase1 = {
              CompanyName: datos[16],
              InvoiceNumber: datos[21],
              InvoiceDate: datos[14],
              DueDate: datos[27],
              Customer: datos[11],
              Description: datos[35],
              SubTotal: getNumbersInString(datos[48]),
              Taxes: getNumbersInString(datos[50]),
              Credit: getNumbersInString(datos[54]),
              total: getNumbersInString(datos[60]),
            };
            break;
          case 2:
            dataBase1 = {
              CompanyName: datos[7],
              InvoiceNumber: getNumbersInString(datos[9]),
              InvoiceDate: datos[11],
              DateDue: datos[13],
              Customer: datos[26],
              Description: datos[32],
              SubTotal: getNumbersInString(datos[43]),
              Taxes: getNumbersInString(datos[45]),
              Credit: getNumbersInString(datos[53]),
              Total: getNumbersInString(datos[55]),
            };

            break;
          case 3:
            dataBase1 = {
              CompanyName: datos[2],
              InvoiceNumber: getNumbersInString(datos[7]),
              InvoiceDate: datos[10],
              DueDate: datos[36],
              Customer: datos[9],
              Description: datos[21],
              SubTotal: getNumbersInString(datos[27]),
              Taxes: getNumbersInString(datos[23]),
              Credit: getNumbersInString(datos[24]),
              total: getNumbersInString(datos[35]),
            };
            break;
        }

        const today = new Date();
        let dbBill = {
          ...dataBase1,
          activeRecord: true,
          createdAt: today,
          updatedAt: today,
          correo: datos,
        };
        await Invoices.insert(dbBill);

        await sendNewRelicEvent({
          ...dataBase1,
          eventType: "DemoInvoices",
        });
      })
      .catch((error) => {
        console.error("Error al procesar el archivo PDF:", error);
      });
  });
}

async function moveEmailsByLabels(gmail, message, arrayLabels){
  await gmail.users.messages.modify({
    userId: "me",  
    id: message.id,
    resource: {
      removeLabelIds: arrayLabels
    },
  });
}

async function generarToken(Credential) {

  let responseX = {
    status: "error",
    code: 500,
    message: "Malformed payload",
  };

  // Ruta del archivo de credenciales y token
 
  // Lee las credenciales y el refresh token
  const { client_id, client_secret , refresh_token} = Credential.access.gmail;

  try {
    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      null,
      {
        params: {
          client_id,
          client_secret,
          refresh_token: refresh_token,
          grant_type: "refresh_token",
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const newAccessToken = response.data.access_token;

    // Guarda el nuevo token si es necesario
    const today = new Date();
    let params = {
      updatedAt: today,
      access: {
        gmail: {
          ...Credential.access.gmail,
          access_token: newAccessToken
        }
      },
  }
    await Credentials.updateById(Credential._id, params); 

    responseX.code = 200;
    responseX.message = "Done";
    responseX.status = "success";
    responseX.tokenNew = newAccessToken;

  } catch (error) {
    console.error(
      "Error refreshing token:",
      error.response ? error.response.data : error.message
    );
    responseX.code = 400;
    responseX.message = error.response ? error.response.data : error.message;
  }
  return responseX;
}

function getNumbersInString(string) {
  var prueba = string;
  var numero = parseFloat(prueba.match(/\d+(\.\d+)?/g));
  return numero;
}

function removeFile(part){
  fs.unlink(part.filename, (err) => {
    if (err) {
      console.error("Error al eliminar el archivo:", err);
    } else {
      console.log("Archivo eliminado con éxito.");
    }
  });
}

const extractEmails = (text) => {
  // Expresión regular para encontrar correos electrónicos
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || []; // Devuelve una lista de correos electrónicos encontrados
};