// src/modules/package/package.controller.ts
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AuraBundleService } from "./auraBundle.service";
import { IAuraBundle } from "./auraBundle.interface";


 const  createPackage = async (req: Request, res: Response) => {
    const payload: IAuraBundle = req.body; // <-- type enforce
    const newPackage = await AuraBundleService.createPackage(payload);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Package created successfully",
      data: newPackage,
    });
  }


  const updatePackage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;
  const updated = await AuraBundleService.updatePackage(id, payload);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Package updated successfully",
    data: updated,
  });
};

const deletePackage = async (req: Request, res: Response) => {
  const { id } = req.params;
  await AuraBundleService.deletePackage(id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Package deleted successfully",
  });
};

const togglePackage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await AuraBundleService.togglePackage(id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Package status toggled successfully",
    data: updated,
  });
};

const getSinglePackage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const pkg = await AuraBundleService.getSinglePackage(id);
  res.status(StatusCodes.OK).json({
    success: true,
    data: pkg,
  });
};

const getAllPackages = async (req: Request, res: Response) => {
  const result = await AuraBundleService.getAllPackages(req.query);
  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
};


export const AuraBundleController = {
  createPackage,
  updatePackage,
  deletePackage,
  togglePackage,
  getSinglePackage,
  getAllPackages
};
