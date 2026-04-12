import CryptoJS from "crypto-js";

export const encrypt = (text: string) =>
  CryptoJS.AES.encrypt(text, process.env.JWT_SECRET!).toString();

export const decrypt = (cipher: string) =>
  CryptoJS.AES.decrypt(cipher, process.env.JWT_SECRET!).toString(
    CryptoJS.enc.Utf8
  );
