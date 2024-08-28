const axios = require("axios");
// files
const { Credentials  } = require("../database/mongo/models/credentials");

module.exports.createToken = async (data) => {

  const Credential = await Credentials.findByType("gmail");
  // Lee las credenciales y el refresh token
  const { client_id, client_secret , refresh_token} = Credential.access.gmail;

  async function refreshToken() {
    let responseX = {
      status: "error",
      code: 500,
      message: "Malformed payload",
    };

    if(Credential==null){
      responseX.code=400;
      responseX.status = "Access Denied";
      responseX.message = "Please review access!"
      return responseX;
    }

    try {
      const response = await axios.post(
        "https://oauth2.googleapis.com/token",
        null,
        {
          params: {
            client_id,
            client_secret,
            refresh_token,
            grant_type: "refresh_token",
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const newAccessToken = response.data.access_token;
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
      responseX.token = newAccessToken;
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

  let res = await refreshToken();
  return res;
};
