'use client';

type MealType = 'DESAYUNO' | 'ALMUERZO' | 'COLACION' | 'COMIDA' | 'CENA';
type MenuType = 'MENU_1' | 'MENU_2' | 'MENU_3' | 'MENU_4';

const MEAL_TYPES: MealType[] = ['DESAYUNO', 'ALMUERZO', 'COLACION', 'COMIDA', 'CENA'];
const MENUS: { id: MenuType; name: string; days: string[] }[] = [
  { id: 'MENU_1', name: 'Menú 1', days: ['LUNES', 'MIÉRCOLES'] },
  { id: 'MENU_2', name: 'Menú 2', days: ['MARTES', 'VIERNES'] },
  { id: 'MENU_3', name: 'Menú 3', days: ['JUEVES'] },
  { id: 'MENU_4', name: 'Menú 4', days: ['SÁBADO', 'DOMINGO'] }
];

interface PatientNutritionPlanViewerProps {
  nutritionPlan: any;
}

export default function PatientNutritionPlanViewer({ nutritionPlan }: PatientNutritionPlanViewerProps) {
  if (!nutritionPlan) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-8 text-center">
        <p className="text-[#6E7C72]">No hay plan alimenticio activo</p>
        <p className="text-sm text-[#6E7C72] mt-2">Tu nutriólogo compartirá tu plan alimenticio pronto</p>
      </div>
    );
  }

  const mealTimes = nutritionPlan.meal_times || {};
  const menus = nutritionPlan.menus || {};

  const getMealContent = (menuId: MenuType, meal: MealType): string => {
    return menus[menuId]?.meals?.[meal]?.description || '';
  };

  const formatTextWithLineBreaks = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Horarios de comidas */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
        <div className="bg-[#5A8C7A] px-6 py-3">
          <h3 className="text-md font-bold text-white">Mis Horarios de Comidas</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {MEAL_TYPES.map(meal => {
              const mealTime = mealTimes[meal];
              if (!mealTime?.start && meal !== 'COLACION') return null;
              return (
                <div key={meal} className="flex items-center gap-4">
                  <div className="w-28">
                    <span className="text-sm font-semibold text-[#2C3E34]">{meal}</span>
                  </div>
                  <div className="flex-1">
                    {meal === 'COLACION' ? (
                      <span className="text-sm text-[#6E7C72]">A elección</span>
                    ) : (
                      <span className="text-sm text-[#6E7C72]">{mealTime?.start} - {mealTime?.end}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Plan de comidas */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
        <div className="bg-[#5A8C7A] px-6 py-3">
          <h3 className="text-md font-bold text-white">Mi Plan Alimenticio</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E6E3DE]">
            <thead className="bg-[#FAF9F7]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider align-top">Comida</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider align-top">Menú 1<br/><span className="text-[10px] font-normal">Lunes, Miércoles</span></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider align-top">Menú 2<br/><span className="text-[10px] font-normal">Martes, Viernes</span></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider align-top">Menú 3<br/><span className="text-[10px] font-normal">Jueves</span></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider align-top">Menú 4<br/><span className="text-[10px] font-normal">Sábado, Domingo</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E6E3DE]">
              {MEAL_TYPES.map(meal => (
                <tr key={meal} className="align-top">
                  <td className="px-4 py-3 text-sm font-semibold text-[#2C3E34] whitespace-nowrap align-top">
                    {meal}
                    {mealTimes[meal]?.start && meal !== 'COLACION' && (
                      <span className="block text-xs font-normal text-[#6E7C72]">{mealTimes[meal]?.start} - {mealTimes[meal]?.end}</span>
                    )}
                    {meal === 'COLACION' && (
                      <span className="block text-xs font-normal text-[#6E7C72]">A elección</span>
                    )}
                  </td>
                  {MENUS.map(menu => {
                    const content = getMealContent(menu.id, meal);
                    return (
                      <td key={menu.id} className="px-4 py-3 align-top">
                        <div className="text-sm text-[#6E7C72] whitespace-pre-wrap">
                          {content ? formatTextWithLineBreaks(content) : '—'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}