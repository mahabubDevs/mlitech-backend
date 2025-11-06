import { ICreateEvent, IUpdateEvent, IEventDB } from "./event.interface";
import { Event } from "./event.module";
import { Game } from "../game/game.model";
import * as path from "path";
import QueryBuilder from "../../../util/queryBuilder";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";

// Helper: map Mongoose doc → IEventDB
const mapEventDoc = (doc: any): IEventDB => ({
  _id: doc._id.toString(),
  eventName: doc.eventName,
  eventType: doc.eventType,
  state: doc.state,
  startDate: doc.startDate,
  endDate: doc.endDate,
  image: doc.image || null,
  status: doc.status,
  isActive: doc.isActive,
  selectedGame: doc.selectedGame,
  offAPPercentage: doc.offAPPercentage,
  createdBy: doc.createdBy ? doc.createdBy.toString() : undefined,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

// Create Event
const createEvent = async (payload: ICreateEvent, files?: any): Promise<IEventDB> => {
  // Attach image
  if (files?.image?.[0]) {
    const fullPath = files.image[0].path;
    payload.image = `/images/${fullPath.split(path.sep).pop()}`;
  }

  // selectedGame validation
  if (payload.eventType === "Unlimited Games") {
    if (!payload.selectedGame?.trim()) throw new Error("selectedGame is required for Unlimited Games event");

    const game = await Game.findOne({ gameTitle: payload.selectedGame }).lean();
    if (!game) throw new Error("Game not found");
    payload.selectedGame = game._id.toString();
  } else {
    payload.selectedGame = undefined;
  }

  // offAPPercentage validation
  if (payload.eventType === "Off APshop") {
    if (payload.offAPPercentage === undefined || payload.offAPPercentage === null)
      throw new Error("offAPPercentage is required for Off APshop event");
  } else {
    payload.offAPPercentage = undefined;
  }

  // Status calculation
  const now = new Date();
  if (new Date(payload.endDate) < now) payload.status = "Expired";
  else if (new Date(payload.startDate) > now) payload.status = "Scheduled";
  else payload.status = "Active";

  const doc = await Event.create(payload);
  return mapEventDoc(doc);
};

// Update Event
const updateEvent = async (eventId: string, payload: IUpdateEvent, files?: any): Promise<IEventDB> => {
  if (files?.image?.[0]) {
    const fullPath = files.image[0].path;
    payload.image = `/images/${fullPath.split(path.sep).pop()}`;
  }

  if (payload.eventType === "Unlimited Games") {
    if (!payload.selectedGame?.trim()) throw new Error("selectedGame is required for Unlimited Games event");

    const game = await Game.findOne({ gameTitle: payload.selectedGame }).lean();
    if (!game) throw new Error("Game not found");
    payload.selectedGame = game._id.toString();
  } else {
    payload.selectedGame = undefined;
  }

  if (payload.eventType === "Off APshop") {
    if (payload.offAPPercentage === undefined || payload.offAPPercentage === null)
      throw new Error("offAPPercentage is required for Off APshop event");
  } else {
    payload.offAPPercentage = undefined;
  }

  // Status calculation
  const now = new Date();
  if (payload.startDate || payload.endDate) {
    if (payload.endDate && new Date(payload.endDate) < now) payload.status = "Expired";
    else if (payload.startDate && new Date(payload.startDate) > now) payload.status = "Scheduled";
    else payload.status = "Active";
  }

  const doc = await Event.findByIdAndUpdate(eventId, payload, { new: true, runValidators: true });
  if (!doc) throw new Error("Event not found");
  return mapEventDoc(doc);
};

// Delete Event
const deleteEvent = async (eventId: string) => {
  const doc = await Event.findByIdAndDelete(eventId);
  if (!doc) throw new Error("Event not found");
  return mapEventDoc(doc);
};

// Toggle Event Status
const toggleEventStatus = async (eventId: string) => {
  const doc = await Event.findById(eventId);
  if (!doc) throw new Error("Event not found");
  doc.isActive = !doc.isActive;
  await doc.save();
  return { id: doc._id.toString(), isActive: doc.isActive };
};

// Get Events (list)
const getEvents = async (query: any) => {
  let baseQuery = Event.find({});
  const qb = new QueryBuilder(baseQuery, query);

  qb.search(['eventName', 'eventType', 'state'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const docs = await qb.modelQuery.lean();

  const data: IEventDB[] = docs.map((doc: any) => ({
    _id: doc._id.toString(),
    eventName: doc.eventName,
    eventType: doc.eventType,
    state: doc.state,
    startDate: doc.startDate,
    endDate: doc.endDate,
    image: doc.image || null,
    status: doc.status,
    isActive: doc.isActive,
    selectedGame: doc.selectedGame,
    offAPPercentage: doc.offAPPercentage,
    createdBy: doc.createdBy ? doc.createdBy.toString() : undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));

  const pagination = await qb.getPaginationInfo();

  return { data, pagination };
};


const getSingleEvent = async (id: string) => {
  const event = await Event.findById(id);
  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Event not found");
  }
  return event;
};


export const EventService = {
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEventStatus,
  getEvents,
  getSingleEvent
};
