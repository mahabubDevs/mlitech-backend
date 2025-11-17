import { JwtPayload } from "jsonwebtoken";
import { SalesRep } from "./salesRep.model";
import { User } from "../user/user.model";

const createSalesRepData = async (user: JwtPayload) => {
  await SalesRep.create({
    customerId: user.id,
  });
};

export const SalesRepService = {
  createSalesRepData,
};
