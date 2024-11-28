import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { toast } from "react-toastify";
import fetchAllProducts from "../helpers/fetchAllProducts";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const cartRef = useRef(cart);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const updatedProducts = await fetchAllProducts("Completed");

        const updatedCart = cartRef.current
          .filter((cartItem) =>
            updatedProducts.some((product) => product._id === cartItem._id)
          )
          .map((cartItem) => {
            const productFromDB = updatedProducts.find(
              (product) => product._id === cartItem._id
            );
            if (
              productFromDB &&
              new Date(productFromDB.updatedAt) > new Date(cartItem.updatedAt)
            ) {
              return { ...cartItem, ...productFromDB };
            }
            return cartItem;
          });

        if (JSON.stringify(updatedCart) !== JSON.stringify(cartRef.current)) {
          setCart(updatedCart);
          localStorage.setItem("cart", JSON.stringify(updatedCart));
          cartRef.current = updatedCart;
        }
      } catch (error) {
        console.error("Error fetching updated products:", error);
      }
    }, 6000);

    return () => clearInterval(intervalId);
  }, []);

  const addToCart = (product, count) => {
    // Kiểm tra sản phẩm trong giỏ hàng dựa trên _id, selectedColor và selectedStorage
    const existingProduct = cart.find(
      (item) =>
        item._id === product._id &&
        item.selectedColor === product.selectedColor &&
        item.selectedStorage === product.selectedStorage
    );

    if (existingProduct) {
      // Nếu sản phẩm đã có trong giỏ hàng, chỉ cập nhật số lượng
      // const updatedCart = cart.map((item) =>
      //   item._id === product._id &&
      //   item.selectedColor === product.selectedColor &&
      //   item.selectedStorage === product.selectedStorage
      //     ? { ...item, amount: item.amount + count }
      //     : item
      // );
      // setCart(updatedCart);
      // localStorage.setItem("cart", JSON.stringify(updatedCart));
      toast.error("Sản phẩm đã được cập nhật trong giỏ hàng");
    } else {
      // Nếu sản phẩm chưa có trong giỏ hàng, thêm mới vào giỏ
      const updatedCart = [...cart, { ...product, amount: count }];
      setCart(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      toast.success("Sản phẩm đã được thêm vào giỏ hàng");
    }
  };

  const updateCart = (newCart) => {
    if (JSON.stringify(newCart) !== JSON.stringify(cart)) {
      setCart(newCart);
      localStorage.setItem("cart", JSON.stringify(newCart));
    }
  };

  const removeFromCart = (productIds) => {
    const updatedCart = cart.filter(
      (product) => !productIds?.includes(product._id)
    );
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    cartRef.current = updatedCart;
    toast.warning("Các sản phẩm đã được xóa khỏi giỏ hàng");
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        cartLength: cart.length,
        updateCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);