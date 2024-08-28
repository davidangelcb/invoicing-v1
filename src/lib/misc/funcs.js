
const Funcs = { 
    async getDataFromBuffer(dataFile) {
        const pdf = require("pdf-parse");
        let dev = await pdf(dataFile)
          .then(async (result) => {
            let datos = result.text.split("\n");
            // Imprime el texto extraído del PDF LOG
            return datos;
          })
          .catch((error) => {
            return [];
          });
        return dev;
      }
     ,
     makeFiels(datos, fields) {
        let dataBase2 = {
          CompanyName: datos[fields.CompanyName],
          InvoiceNumber: this.getNumbersInString(datos[fields.InvoiceNumber]),
          DateInvoice: datos[fields.DateInvoice],
          DateDue: datos[fields.DateDue],
          Customer: datos[fields.Customer],
          Description: datos[fields.Description],
          SubTotal: this.getNumbersInString(datos[fields.SubTotal]),
          Taxes: this.getNumbersInString(datos[fields.Taxes]),
          Credit: this.getNumbersInString(datos[fields.Credit]),
          Total: this.getNumbersInString(datos[fields.Total]),
        };
        return dataBase2;
      }
      ,
      getNumbersInString(string) {
       
        var prueba = string. replace(/,/g, '');
        if(string==''){
          return 0;
        }
        var numero = parseFloat(prueba.match(/\d+(\.\d+)?/g));
        return numero;
      }
  };
  
  exports.Funcs = Funcs;