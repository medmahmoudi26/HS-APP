require("dotenv").config();

const hubspot = require("@hubspot/api-client");
const bodyParser = require("body-parser");
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const url = require("url");

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.listen(process.env.PORT, () => {
    console.log(`Sample app listening on port ${process.env.PORT}`);
});

app.get("/install", (req, res) => {
    const hubspotClient = new hubspot.Client();
  
    const uri = hubspotClient.oauth.getAuthorizationUrl(
      process.env.CLIENT_ID,
      process.env.REDIRECT_URI,
      "crm.objects.contacts.write"
    );
  
    res.redirect(uri);
  });
  
app.get("/oauth-callback", async (req, res) => {
    // here we create a payload as prescribed by HubSpot for the token exchange where our app exchanges the temporary authorization code for an access token that can be used to call HubSpot APIs
    const payload = {
      grant_type: "authorization_code",
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: process.env.REDIRECT_URI,
      code: req.query.code,
    };
  
    const params = new url.URLSearchParams(payload);
  
    // we are using the rest api method here to exchange the tokens
    const apiResponse = await axios.post(
      "https://api.hubapi.com/oauth/v1/token",
      params.toString()
    );
  
  // once we receive the access token we can instantiate a hubspot client using the official client library and reuse it across the codebase for our own convenience
    const hubspotClient = new hubspot.Client({
      accessToken: apiResponse.data.access_token,
    });
  
    const dummyContact = {
      properties: {
        firstname: "Bruce",
        lastname: "Wayne",
      },
    };
  
    // this will create a contact in the hubspot crm of the user who installs our app with firstname and lastname as declared above
    await hubspotClient.crm.contacts.basicApi.create(dummyContact);
    
    return res.sendStatus(200);
});