import admin from "firebase-admin";

const serviceAccount = {
  "type": "service_account",
  "project_id": "miltech-c3007",
  "private_key_id": "f9b80ae5a5bf85073f3ad5ce9d0d6778aaf8e5fe",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDlgM+EeeV9nSPe\nue+PVLD9bQCC9BDcjgwc0Iqjh021DX/DgqpWu/FPBo7lxsJA7aE3XFPgclgv7ePa\nozS6FO1LPLaDJ3dCzGyNfqTVtBi+QE7HRKomUMJ8PdXGEyKdrh8tmiMbJHKD9ZT2\ndeEnTsiQv7tRUdFcPQnTZxzsciicHkhS5t5zYoetlXxtRYSDSD0SbiaioDAZ9dyl\nPxIAQ4ppUrAXcVNpfmn72JoL5ywaIeYP8eYRWs/hc3LuhUbF72JauC6uh0V1uYjj\na9IAsS1ROFNR6789wCnITM/QNm5rhDkuam/2Web0PCs/zOCxbD7tUk346rEqYIOt\nnd/OWa/3AgMBAAECggEAaPiHMhEtAczXhL5nz5eNkoSCOONYOQDxklZiKxSuWrLv\nbqW7soso/pvBzWAhJmBqHi+pH549LsLwtmZyre/3bzO4SPnKpy9oMTmtPB+xN4ej\nYKpL5tWGdxwzRHMpIJTtJsb66qW7iRbRCP92uatjui0wCKxTBYzXiy19AbrfTzP+\nmj98iDev4z+LJgqBhBUmXkyI59H/pdubcrW9Gm0zvIDVZL65za7pf6rtKBZ2+ql7\ncy+0AgVBUsZmbvPFDCCOk8H6jjtnmIo3Ul3p4SzgTBgVUA1SEnVXYj8IsgfWUZu5\na+dt6MJh8XR6mGnAyXzSQLRSyn1GfpqFLr68uuueqQKBgQD/OW+Lnd3p+RdAz7HK\nal64XyXihJFVbRm2OiA6XzmfszL7SU8ldxDb+sQRAEogVlNywEQvG427ZdDQVOJ8\nnolUrQDQVPrwz6PeQur6TkM28YtHAxI9ixwBaYzKssRvanQSn4u+3vYs3wLNnVy0\n0fB6OogOaxTMtJimiEly7M+uqQKBgQDmM10kD7JvE1V0KzIFZGYHJlIxRBN2Q4e4\n5RMRGppnlx83UUk3gR4ZMG/WRV7a2EuDhPFzUsKV1qW/DsXlBLCgKvSEzPzjnS7X\nGquebd/Sb7Yfeb8YPEX3zg5+O61+UtLHmxi7uPGuobnCpERf/g+lYGjZsO1U2Ohv\nI969djStnwKBgDd2odjza6BG81iwSfC1APSMKM17BaJM3UOOiiZlPz6HUNLu8XYw\n08caTbVsHK++UtAjHC4ojLpmu+QqLjXqteli10Ru00G1veS1Ih9XFqBACYZbEoGx\nU1qzN1dtVeboeWT6qwHFrjW+GPvZ8KWS4fGN+rc3agO6U1oNT/jboZ5RAoGAXORx\nO3ISIPx+SUh9AOwIt+3g0PyVle2eQSA/V3GSySaUdDAbCYjS6ns/RgnsQwdxQXtO\nK6lD2E8rxzNg7A++boOm9Ef77KWrFyYuBtpzrWli5sSsNk1sNpkyBAJ0+jrVz7Jo\ngqgY7s1YNpEu/kV5btS+usnIm6qD8QVahr3CeCUCgYEAiYLJFeJ0KJteggXFIxtO\n0FS5/nUuisea/6eC2QCnCUa/6h1xms2xfghG6HSTiZVZuxyTM2qplVkB155iuewU\n540rnU0lKJEloO9ac+Zb8stObPMrFjDB7R/SB6Uxx60yQm093G1O5i11YH3jjVzT\n9YaykOBW3PogmrO9eO574Vo=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@miltech-c3007.iam.gserviceaccount.com",
  "client_id": "115283196043936857419",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40miltech-c3007.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export default admin;