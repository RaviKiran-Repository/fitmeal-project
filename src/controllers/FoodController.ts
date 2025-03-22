import { Request, Response } from "express";
import { FoodService } from "../services/FoodService";

export class FoodController {
  // Fetch foods from USDA API
  static async getFoods(req: Request, res: Response) {
    try {
      const result = await FoodService.getFoods(req);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error fetching food data" });
    }
  }

  // Add food to meal log
  static async addFoodToMealLog(req: Request, res: Response) {
    try {
      const result = await FoodService.addFoodToMealLog(req);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error adding food" });
    }
  }

  // Remove food from meal log
  static async removeFood(req: Request, res: Response) {
    try {
      const { foodId } = req.params;
      const updatedMealLog = await FoodService.removeFood(Number(foodId));

      if (!updatedMealLog) {
        return res.status(404).json({ message: "Food not found in meal log" });
      }

      res.json(updatedMealLog);
    } catch (error) {
      console.error("Error removing food:", error);
      res.status(500).json({ message: "Error removing food" });
    }
  }
}
