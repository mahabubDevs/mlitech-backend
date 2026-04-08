"use strict";
// import { Request, Response } from "express";
// import { StatusCodes } from "http-status-codes";
// import catchAsync from "../../../shared/catchAsync";
// import sendResponse from "../../../shared/sendResponse";
// import { EventService } from "./event.service";
// import { ICreateEvent, IUpdateEvent } from "./event.interface";
// // Create Event
// const createEvent = catchAsync(async (req: Request, res: Response) => {
//   const payload = req.body.data ? JSON.parse(req.body.data) : {};
//   payload.createdBy = (req.user as any)?._id;
//   const result = await EventService.createEvent(payload, req.files);
//   sendResponse(res, {
//     success: true,
//     statusCode: StatusCodes.CREATED,
//     message: "Event created successfully",
//     data: result,
//   });
// });
// // Update Event
// const updateEvent = catchAsync(async (req: Request, res: Response) => {
//   const payload = req.body.data ? JSON.parse(req.body.data) : {};
//   const eventId = req.params.id;
//   const result = await EventService.updateEvent(eventId, payload, req.files);
//   sendResponse(res, {
//     success: true,
//     statusCode: StatusCodes.OK,
//     message: "Event updated successfully",
//     data: result,
//   });
// });
// // Delete Event
// const deleteEvent = catchAsync(async (req: Request, res: Response) => {
//   const result = await EventService.deleteEvent(req.params.id);
//   sendResponse(res, {
//     success: true,
//     statusCode: StatusCodes.OK,
//     message: "Event deleted successfully",
//     data: result,
//   });
// });
// // Toggle Status
// const toggleEventStatus = catchAsync(async (req: Request, res: Response) => {
//   const result = await EventService.toggleEventStatus(req.params.id);
//   sendResponse(res, {
//     success: true,
//     statusCode: StatusCodes.OK,
//     message: result.isActive ? "Event activated" : "Event blocked",
//     data: result,
//   });
// });
// // Get Events
// const getEvents = catchAsync(async (req: Request, res: Response) => {
//   const result = await EventService.getEvents(req.query);
//   sendResponse(res, {
//     success: true,
//     statusCode: StatusCodes.OK,
//     message: "Events fetched successfully",
//     data: result.data,
//     pagination: result.pagination,
//   });
// });
// const getSingleEvent = catchAsync(async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const result = await EventService.getSingleEvent(id);
//   sendResponse(res, {
//     success: true,
//     statusCode: StatusCodes.OK,
//     message: "Event fetched successfully",
//     data: result,
//   });
// });
// export const EventController = {
//   createEvent,
//   updateEvent,
//   deleteEvent,
//   toggleEventStatus,
//   getEvents,
//   getSingleEvent
// };
