import { Game } from "./game.model";
import { ICreateGame, IUpdateGame, IGameDB } from "./game.interface";
import QueryBuilder from "../../../util/queryBuilder";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";

// Helper: map mongoose doc to IGameDB
const mapGameDocToIGameDB = (doc: any): IGameDB => ({
  _id: doc._id.toString(),
  gameTitle: doc.gameTitle,
  description: doc.description,
  image: doc.image || null,
  isActive: doc.isActive,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  createdBy: doc.createdBy ? doc.createdBy.toString() : undefined,
});

// Create Game
// const createGameInDB = async (payload: ICreateGame): Promise<IGameDB> => {
//   const doc = await Game.create(payload);
//   return mapGameDocToIGameDB(doc);
// };

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const createGameInDB = async (payload: ICreateGame): Promise<IGameDB> => {
  // 2 মিনিট delay → 120000ms
  await delay(120000);

  const doc = await Game.create(payload);
  return mapGameDocToIGameDB(doc);
};

// Update Game
const updateGameInDB = async (gameId: string, payload: IUpdateGame): Promise<IGameDB> => {
  const doc = await Game.findByIdAndUpdate(gameId, payload, { new: true, runValidators: true });
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, "Game not found");
  return mapGameDocToIGameDB(doc);
};

// Delete Game
const deleteGameFromDB = async (gameId: string): Promise<IGameDB> => {
  const doc = await Game.findByIdAndDelete(gameId);
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, "Game not found");
  return mapGameDocToIGameDB(doc);
};

// Toggle Active/Inactive
const toggleGameStatusInDB = async (gameId: string) => {
  const doc = await Game.findById(gameId);
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, "Game not found");
  doc.isActive = !doc.isActive;
  await doc.save();
  return { id: doc._id.toString(), isActive: doc.isActive };
};

// Get all games
const getGamesFromDB = async (query: any) => {
  let baseQuery = Game.find({});
  const qb = new QueryBuilder(baseQuery, query);

  qb.search(["gameTitle", "description"]);

  if (query.status) {
    if (query.status === "active") qb.modelQuery = qb.modelQuery.find({ isActive: true });
    if (query.status === "inactive") qb.modelQuery = qb.modelQuery.find({ isActive: false });
  }

  qb.filter().sort().paginate().fields();

  const docs = await qb.modelQuery.lean();
  const data = docs.map((doc: any) => ({
    ...doc,
    _id: doc._id.toString(),
    createdBy: doc.createdBy ? doc.createdBy.toString() : undefined,
  }));

  const pagination = await qb.getPaginationInfo();

  return { data, pagination };
};

// Get single game
const getSingleGameFromDB = async (id: string) => {
  const game = await Game.findById(id);
  if (!game) throw new ApiError(StatusCodes.NOT_FOUND, "Game not found");
  return game;
};

export const GameService = {
  createGameInDB,
  updateGameInDB,
  deleteGameFromDB,
  toggleGameStatusInDB,
  getGamesFromDB,
  getSingleGameFromDB,
};
