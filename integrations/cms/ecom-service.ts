/**
 * Mock implementation of ecom service for local development
 */

/** CMS App ID for catalog references */
// const CMS_APP_ID = "e593b0bd-b783-45b8-97c2-873d42aacaf4";

export async function buyNow(
  items: Array<{ collectionId: string; itemId: string; quantity?: number }>
): Promise<void> {
  console.warn("buyNow called with items:", items);
  alert("Buy Now feature is disabled in local development mode.");
}

export function useEcomService() {
  const addToCart = async (
    items: Array<{ collectionId: string; itemId: string; quantity?: number }>
  ): Promise<void> => {
    console.warn("addToCart called with items:", items);
    alert("Add to Cart feature is disabled in local development mode.");
  };

  const checkout = async (): Promise<void> => {
    console.warn("checkout called");
    alert("Checkout feature is disabled in local development mode.");
  };

  return {
    isCartAvailable: false,
    addToCart,
    checkout,
  };
}

