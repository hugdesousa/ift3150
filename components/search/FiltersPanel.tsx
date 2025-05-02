"use client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { X } from "lucide-react";
import FilterSlider from "./FilterSlider";
import { GeoFilter } from "../ui/GeoFilter";
import { Filters } from "@/lib/utils/filters";

export default function FiltersPanel({
  open,
  onClose,
  filters,
  setFilters,
  requestLocation,
}: {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  requestLocation: () => void;
}) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="scale-95 opacity-0"
              enterTo="scale-100 opacity-100"
              leave="ease-in duration-150"
              leaveFrom="scale-100 opacity-100"
              leaveTo="scale-95 opacity-0"
            >
              <Dialog.Panel className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <Dialog.Title className="text-lg font-medium">
                    Filtres
                  </Dialog.Title>
                  <X className="size-5 cursor-pointer" onClick={onClose} />
                </div>

                <FilterSlider
                  label="Prix min"
                  value={filters.minPrice}
                  min={0}
                  max={200}
                  onChange={(v) => setFilters((f) => ({ ...f, minPrice: v }))}
                />
                <FilterSlider
                  label="Prix max"
                  value={filters.maxPrice}
                  min={0}
                  max={1000}
                  onChange={(v) => setFilters((f) => ({ ...f, maxPrice: v }))}
                />
                <FilterSlider
                  label="Note minimale"
                  value={filters.rating}
                  min={0}
                  max={5}
                  step={1}
                  onChange={(v) => setFilters((f) => ({ ...f, rating: v }))}
                />

                <GeoFilter
                  filters={filters}
                  setFilters={setFilters}
                  requestLocation={requestLocation}
                />

                <button
                  onClick={onClose}
                  className="mt-6 w-full rounded-lg bg-amber-600 py-2 font-semibold text-white"
                >
                  Appliquer
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
