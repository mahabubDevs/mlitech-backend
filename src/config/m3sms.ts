import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export const sendOtp = async (phone: string, otp: string) => {
  try {
    const soapUrl = process.env.M3_SMS_URL;

    if (!soapUrl) {
      throw new Error("M3_SMS_URL environment variable is not set");
    }

    const msgId = uuidv4();

    console.log("📨 Sending OTP SMS");
    console.log("📱 Phone:", phone);
    console.log("🔢 OTP:", otp);
    console.log("🆔 MsgId:", msgId);
    console.log("🌐 SMS URL:", soapUrl);

    const xml = `<?xml version="1.0" encoding="utf-8"?>
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
      <HandsetPort>0</HandsetPort>
      <SMSChannel>OTP</SMSChannel>
    </SendSMS>
  </soap:Body>
</soap:Envelope>`;


    console.log("📦 SOAP Request XML:\n", xml);

    const response = await axios.post(soapUrl, xml, {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "http://tempuri.org/SendSMS",
      },
      timeout: 15000,
    });

    console.log("✅ SMS API Response Status:", response.status);
    console.log("✅ SMS API Response Headers:", response.headers);
    console.log("✅ SMS API Response Data:\n", response.data);

    return response.data;
  } catch (error: any) {
    console.error("❌ OTP SMS Failed");

    if (error.response) {
      console.error("❌ Response Status:", error.response.status);
      console.error("❌ Response Data:", error.response.data);
    } else if (error.request) {
      console.error("❌ No response from SMS server");
    } else {
      console.error("❌ Error Message:", error.message);
    }

    throw error;
  }
};
