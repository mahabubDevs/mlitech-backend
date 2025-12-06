// src/modules/package/package.controller.ts
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AuraSubscriptionService,  } from "./aurashop.service";
import { IPackage } from "../package/package.interface";


 const  createPackage = async (req: Request, res: Response) => {
    const payload: IPackage = req.body; // <-- type enforce
    console.log("Payload received in controller:", payload);
    const newPackage = await AuraSubscriptionService.createPackage(payload);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Package created successfully",
      data: newPackage,
    });
  }


  const updatePackage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;
  const updated = await AuraSubscriptionService.updatePackage(id, payload);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Package updated successfully",
    data: updated,
  });
};

const deletePackage = async (req: Request, res: Response) => {
  const { id } = req.params;
  await AuraSubscriptionService.deletePackage(id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Package deleted successfully",
  });
};

const togglePackage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await AuraSubscriptionService.togglePackage(id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Package status toggled successfully",
    data: updated,
  });
};

const getSinglePackage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const pkg = await AuraSubscriptionService.getSinglePackage(id);
  res.status(StatusCodes.OK).json({
    success: true,
    data: pkg,
  });
};

const getAllPackages = async (req: Request, res: Response) => {
  const result = await AuraSubscriptionService.getAllPackages(req.query);
  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
};




export const AuraSubscriptionController = {
  createPackage,
  updatePackage,
  deletePackage,
  togglePackage,
  getSinglePackage,
  getAllPackages
};
