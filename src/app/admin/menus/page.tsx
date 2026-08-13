import {
  getAllMealOptions,
} from '@/lib/meal-options-actions';

import MealOptionsManager from '@/components/menus/MealOptionsManager';


export const dynamic =
  'force-dynamic';


export default async function MenusPage() {
  const options =
    await getAllMealOptions();


  return (
    <main className="min-h-screen bg-[#FAF9F7] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#5A8C7A]">
            Menús Alimenticios
          </h1>

          <p className="mt-1 text-[#6E7C72]">
            Administra las opciones de desayuno, almuerzo, colación, comida y cena.
          </p>
        </div>


        <MealOptionsManager
          initialOptions={
            options
          }
        />
      </div>
    </main>
  );
}