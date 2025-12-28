import React from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const OtpCodes = () => {
  return (
    <div className={"dark"}>
      <div>
        <h1 className="text-2xl font-bold mb-4">OTP Codes</h1>
      </div>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 p-8">
        <div className="flex items-center justify-between">
          <p className="text-gray-600 dark:text-gray-400">
            No OTP codes found.
          </p>
          <Carousel className="w-full max-w-xs">
            <CarouselContent>
              {Array.from({ length: 5 }).map((_, index) => (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <Card>
                      <CardContent className="flex aspect-square items-center justify-center p-6">
                        <span className="text-4xl font-semibold">
                          {index + 1}
                        </span>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default OtpCodes;
