"use client";

import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <nav aria-label="Progreso del formulario" className="mb-8">
      <ol className="flex items-center w-full overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <li
            key={step}
            className={cn(
              "flex items-center text-xs font-medium whitespace-nowrap",
              index < steps.length - 1 && "flex-1"
            )}
          >
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 transition-colors",
                  index < currentStep &&
                    "bg-emerald-600 border-emerald-600 text-white",
                  index === currentStep &&
                    "bg-blue-600 border-blue-600 text-white",
                  index > currentStep &&
                    "bg-white border-gray-300 text-gray-500"
                )}
                aria-current={index === currentStep ? "step" : undefined}
              >
                {index < currentStep ? "✓" : index + 1}
              </span>
              <span
                className={cn(
                  "mt-1 text-center hidden sm:block",
                  index <= currentStep ? "text-gray-900" : "text-gray-400"
                )}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 mt-0 sm:-mt-4",
                  index < currentStep ? "bg-emerald-600" : "bg-gray-200"
                )}
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
