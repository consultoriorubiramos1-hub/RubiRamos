'use client';

import Image from 'next/image';
import { useState } from 'react';
import { FaTrash, FaPlus, FaMinus, FaShoppingCart } from 'react-icons/fa';

// Datos de ejemplo para el carrito
const initialCartItems = [
  {
    id: 1,
    name: 'Colágeno Premium',
    image: '/colageno.png',
    price: 399,
    quantity: 2,
  },
  {
    id: 2,
    name: 'Prowinner Protein',
    image: '/prowinner.png',
    price: 549,
    quantity: 1,
  },
  {
    id: 3,
    name: 'Pure Pre-Workout',
    image: '/purepre.png',
    price: 449,
    quantity: 3,
  },
];

export default function ShoppingCart() {
  const [cartItems, setCartItems] = useState(initialCartItems);

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const getItemTotal = (price: number, quantity: number) => {
    return price * quantity;
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
        <div className="text-center py-12">
          <FaShoppingCart className="text-gray-300 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Tu carrito está vacío</h2>
          <p className="text-gray-500">Agrega algunos productos para continuar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaShoppingCart className="text-green-500" />
          Carrito de Compras
        </h1>
        <p className="text-gray-600 mt-2">
          {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'} en tu carrito
        </p>
      </div>

      {/* Lista de productos */}
      <div className="space-y-6 mb-8">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
          >
            {/* Imagen del producto */}
            <div className="w-20 h-20 relative flex-shrink-0">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-contain rounded-lg"
              />
            </div>

            {/* Nombre del producto */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-800 truncate">
                {item.name}
              </h3>
              <p className="text-green-600 font-bold text-xl">
                {formatPrice(item.price)}
              </p>
            </div>

            {/* Contador de cantidad */}
            <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-300 p-1">
              <button
                title='Cantidad'
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              >
                <FaMinus size={12} />
              </button>
              
              <span className="w-8 text-center font-semibold text-gray-800">
                {item.quantity}
              </span>
              
              <button
                title='Cant'
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              >
                <FaPlus size={12} />
              </button>
            </div>

            {/* Total por producto */}
            <div className="text-right min-w-24">
              <p className="text-lg font-bold text-gray-800">
                {formatPrice(getItemTotal(item.price, item.quantity))}
              </p>
              <p className="text-sm text-gray-500">
                {item.quantity} × {formatPrice(item.price)}
              </p>
            </div>

            {/* Botón eliminar */}
            <button
              onClick={() => removeItem(item.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="Eliminar producto"
            >
              <FaTrash size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Resumen del carrito */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-700">Subtotal:</span>
          <span className="text-xl font-bold text-gray-800">
            {formatPrice(getCartTotal())}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-700">Envío:</span>
          <span className="text-xl font-bold text-green-600">Gratis</span>
        </div>
        
        <div className="border-t border-green-200 pt-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-gray-800">Total:</span>
            <span className="text-3xl font-bold text-green-600">
              {formatPrice(getCartTotal())}
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4">
          <button className="flex-1 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors duration-300 text-center">
            Seguir Comprando
          </button>
          <button 
            className="flex-1 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors duration-300 text-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #A8CF45, #7DA82E)'
            }}
          >
            Proceder al Pago
          </button>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>✅ Envío gratis en compras mayores a $500</p>
        <p>✅ Devoluciones dentro de los 30 días</p>
        <p>✅ Pago seguro con cifrado SSL</p>
      </div>
    </div>
  );
}