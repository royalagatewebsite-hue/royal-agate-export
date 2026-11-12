import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import { useAuth } from "./AuthContext";

import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../services/cartService";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch latest cart
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getCart();

      setCart(data);

      return data;
    } catch (err) {
      setError(err.message || "Unable to load cart.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load cart after login
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart().catch(() => {});
    } else {
      setCart(null);
      setError(null);
    }
  }, [isAuthenticated, refreshCart]);

  // Add product to cart
  const addItem = async (productData) => {
    const response = await addToCart(productData);

    await refreshCart();

    return response;
  };

  // Update item quantity
  const updateItem = async (itemId, quantity) => {
    const response = await updateCartItem(itemId, quantity);

    await refreshCart();

    return response;
  };

  // Remove item from cart
  const removeItem = async (itemId) => {
    const response = await removeCartItem(itemId);

    await refreshCart();

    return response;
  };

  // Clear entire cart
  const emptyCart = async () => {
    const response = await clearCart();

    await refreshCart();

    return response;
  };

  const value = {
    cart,
    items: cart?.items || [],
    totalItems: cart?.total_items || 0,
    totalAmount: cart?.total_amount || 0,
    loading,
    error,
    refreshCart,
    addItem,
    updateItem,
    removeItem,
    emptyCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return context;
}