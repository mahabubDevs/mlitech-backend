// import axios from "axios";
// import config from "../config";

// export const sendOtp = async (phone: string, otp: string) => {
//   try {
//     const url = "https://api.veevotech.com/v3/sendsms";

//     const payload = {
//       hash: config.veevoTech.apiKey,
//       receivernum: phone,
//       sendernum: "Default",
//       textmessage: `Your OTP is ${otp}`,
//     };

//     console.log("Sending OTP to:", phone);
//     console.log("Payload:", payload);

//     const response = await axios.post(url, payload);

//     console.log("VeevoTech Response:", response.data);

//     return response.data;
//   } catch (error: any) {
//     console.error("OTP Send Error:", error.response?.data || error.message);
//     throw error;
//   }
// };



import axios from "axios";
import config from "../config";

export const sendOtp = async (phone: string, otp: string) => {
  try {
    const url = "https://api.veevotech.com/v3/sendsms";

    const payload = {
      hash: config.veevoTech.apiKey,
      receivernum: phone,
      sendernum: "Default",
      textmessage: `Your OTP is ${otp}`,
    };

    console.log("Sending OTP to:", phone);

    const response = await axios.post(url, payload);

    console.log("VeevoTech Response:", response.data);

    // 🔴 Important validation
    if (response.data.STATUS !== "SUCCESS") {
      throw new Error(
        `SMS Failed: ${response.data.ERROR_DESCRIPTION || "Unknown error"}`
      );
    }

    return response.data;
  } catch (error: any) {
    console.error("OTP Send Error:", error.response?.data || error.message);
    throw error;
  }
};