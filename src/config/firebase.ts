import admin from "firebase-admin";

const serviceAccount = {
  "type": "service_account",
  "project_id": "paulinefst-ab407",
  "private_key_id": "28b5b8dbbd4244063d3c81ad3805099afe867af0",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCz5tyzeg2xJ8oO\nrSxGuB4O6yhJuNRQtB4G5FnBstibnlDH2f1CQEr5BW6qTqxYnPkvhwikdrJbG+aD\nlU3lzQYvKO8EXL8H8sgeIvv/SMZQRHfttIHh3BuXjKY8EoTWmgd0BinngGZyEQAt\nLTvz63cjV3UY/nWpwc6e6So/yrkGwKrTut6KhwPpn10WoL4jllrSNVXdJ9mZbSNV\nWizC6Md9n7i+GlhMDee765ud/NsJaH5G61daDG5a/h+rFLF/ah/2lIMf6W+gW9vN\nLWkBCy7iaJX3+0HgjaRU/+p/VpaOcQNjvwR3glZAxhcjITrHSDw73Gr3lrKUxl5R\naISTpFWfAgMBAAECggEABL0ZwDQ8TBfE4dEEmFjQZiR3k97hRq1ToOKURM3Ah689\nm1k83q16EFkkrtTOFJCGeeyLtMyCiJWzsApGWlcdHjAXkg36jeu1vsvfgt5URItk\n4y2c0wNmbIaTPQzGwrdH8AtfYqoVKt1Xgh1lLSWhczYREUhn7hcMIQstG7hBSUln\nTNRP3rjP47jbb0lc/dDL+9/b5TGxxsX3wFNFsyAj0QwbSILU3M4+M5MKmaQLeZto\ndDGVowE9Dg61/u1taUBhvOu+L855H4m+61OREA2irvIVTJjm3nOWdwc1n7FClnLw\nRQkvbR+jsPdJSX7iS3d+5CDm1oGhEzoUkmHy0MLuIQKBgQD2Q3FRflX/A7VeW/4a\nYK28qrOijr3RAkaLBioeWq411qjIuIAOYdM6jc+RO5dG/wF7Dl8NBC3YwsWMogP1\n3ZW5FpZcYIpQYAcI0KKsgyfopKtkPl1kE5VmJ5I8L8JxaKifCn4vcVzHpnfrf9nE\nyzWwk64dVBDO6qG9Pbd+xDVQ1wKBgQC7A71WGoE57c+0FbCeEeSxZIeHLNdfTe4V\n0uvbE7QcnkGSJbd3tBre5YRMDETn+A+CJJx4UaWM5msG5icf/2f1dkjd/Z4jj2Sd\nPizgN+0wpF2OTMG2+8OH4O+NNzS9IDe+0ESoqsa0Qm2NVqdKsHPLhRhKhfjpQIXS\nvLZcllPgeQKBgQDBbW/QZr79Mth+aRtJdK6CBkJaaGvHg1YNVKY4eVlkiFrCbciH\ng2b6EvD6TiggZ6OuGDeobaPlIfcw4wDhWU6Etq0bmeiKASMFVXqwrcPnA5BriGCq\nfodWWbaO96Rul5n6ca9zbENHvgVrQFy4KjTdoOGdv64EGF852QQL2elWuQKBgB2h\nqg5KhM847wAJr8Jb83BoDVFNuZJQNrkegmBj7tXZ/Wm6sCc3Ukqe8ydZilF27H4i\nbuhhh2mb2LlvHiPjxAUQiNsjpDreLYL8pv+f3OUoJeq2HrtviLuu2EX3yVNuF2cU\neMyAwpstK06JvFgJPU+x9vdX4uiSYKHTZNGmwAOBAoGAd2bE647M3GbWYGEsHKBK\nBXlPqgq1w3q2ifXaCwh+2mJVCw4CC/efKn+aXnv4HMsFpiyw+IPiQeAL7pRU6lg2\npZ0FuRSP9DcnwrTXVCebyL1GfrdGzFAV4UmQMmuFakb7Iqd3et9HmMMCDCVjOzIp\nFOU02qQSqVy0oxBT4j7R7Vk=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@paulinefst-ab407.iam.gserviceaccount.com",
  "client_id": "115096160587140893557",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40paulinefst-ab407.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export default admin;