export interface DetectFoodsRequest {
    imageUrl?: string;
    imageBase64?: string;
    menu?: string;
}

export interface MealRecommenderRequest {
    context: string;
}