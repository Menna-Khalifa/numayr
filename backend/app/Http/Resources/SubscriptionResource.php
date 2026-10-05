<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'address_id' => $this->address_id,
            'coolers_count' => $this->coolers_count,

            'plan_code' => $this->plan_code,
            'plan_name_ar' => $this->plan_name_ar,
            'plan_name_en' => $this->plan_name_en,

            'billing_cycle' => $this->billing_cycle,
            'price' => $this->price,
            'currency' => $this->currency,

            'status' => $this->status,
            'starts_at' => $this->starts_at,
            'ends_at' => $this->ends_at,
            'cancelled_at' => $this->cancelled_at,

            'benefits' => $this->benefits,

            'plan' => $this->whenLoaded('plan'),

            'address' => $this->whenLoaded('address'),

            'coolers' => $this->whenLoaded('coolers'),

            'payments' => PaymentResource::collection(
                $this->whenLoaded('payments')
            ),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
