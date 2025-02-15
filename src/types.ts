export interface FoodDictionary {
    [key: string]: string;
}

export interface DetectFoodsRequest {
    imageUrl?: string;
    imageBase64?: string;
    menu?: string;
}

export interface MealRecommenderRequest {
    context: string;
}

export interface GetDescriptionRequest {
    context: string;
}

export interface GenerateImagesResponse {
    [key: string]: string | null;
}

export interface DetectFoodsResponse {
    foods: string;
}

export interface MealRecommenderResponse {
    plan: string;
}

export interface GetDescriptionResponse {
    plan: string;
}