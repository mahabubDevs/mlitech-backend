import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export const sendOtp = async (phone: string, otp: string) => {
  const soapUrl = process.env.M3_SMS_URL;

  if (!soapUrl) {
    throw new Error("M3_SMS_URL environment variable is not set");
  }

  const msgId = uuidv4();

  const xml = `
  <?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                 xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
      <SendSMS xmlns="http://tempuri.org/">
        <UserId>${process.env.M3_SMS_USER_ID}</UserId>
        <Password>${process.env.M3_SMS_PASSWORD}</Password>
        <MobileNo>${phone}</MobileNo>
        <MsgId>${msgId}</MsgId>
        <SMS>Your OTP is ${otp}</SMS>
        <MsgHeader>${process.env.M3_SMS_HEADER}</MsgHeader>
      </SendSMS>
    </soap:Body>
  </soap:Envelope>
  `;

  const response = await axios.post(soapUrl, xml, {
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: "http://tempuri.org/SendSMS",
    },
  });

  return response.data;
};
