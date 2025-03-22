import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const USDA_API_KEY = process.env.USDA_API_KEY;

// Mock database to store meal log
let mealLog: Array<{ id: number; food_name: string; nutrientNumber: string | number; quantity: number }> = [];

export class FoodService {
  // Fetch foods from USDA API
  static async getFoods(req: any) {
    const { query } = req.query;
    if (!query) throw new Error("Query parameter is required");

    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${query}&api_key=${USDA_API_KEY}`
    );
    const data = await response.json() as { foods: Array<{ fdcId: number; description: string; foodNutrients: Array<{ nutrientName: string; value: number }> }> };

    if (!data.foods || data.foods.length === 0) {
      throw new Error("No food items found");
    }

    return data.foods.map((food: any) => ({
      id: food.fdcId,
      food_name: food.description,
      calories: food.foodNutrients?.find((n: any) => n.nutrientName === "Energy")?.value || 0,
    }));
  }

  // Add selected food to meal log
  static async addFoodToMealLog(req: any) {
    const { foodId } = req.params;
    const foodIdNumber = Number(foodId);

    if (isNaN(foodIdNumber)) {
      throw new Error("Invalid food ID");
    }

    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/food/${foodIdNumber}?api_key=${USDA_API_KEY}`
    );
    const food = await response.json() as { 
      fdcId: number; 
      description: string; 
      foodNutrients: Array<{ nutrientName: string; nutrientNumber: string }> 
    };

    if (!food || !food.fdcId) {
      throw new Error("Food not found");
    }

    // Correct way to extract nutrientNumber
    const nutrientNumber = food.foodNutrients?.find(
        (n) => n.nutrientName === "Energy"
    )?.nutrientNumber || "Not Found";
      
    console.log(nutrientNumber);    

    const newFood = { 
      id: food.fdcId, 
      food_name: food.description, 
      nutrientNumber, 
      quantity: 1 
    };

    mealLog.push(newFood);

    return { message: "Food added", mealLog };
}


  // Remove food from meal log
  static async removeFood(foodId: number) {
    const foodIndex = mealLog.findIndex((food) => food.id === foodId);

    if (foodIndex === -1) {
      return null; // Food not found in the meal log
    }

    mealLog.splice(foodIndex, 1);
    return { message: "Food removed successfully", mealLog }; // Return updated meal log
  }
}
