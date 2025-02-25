import Macro from "./Macros";

export default interface FoodLog {
  userId: Number;
  date: Date;
  target: Macro;
  consumed: Macro;
  ids: { id: number; quantity: number }[];
}