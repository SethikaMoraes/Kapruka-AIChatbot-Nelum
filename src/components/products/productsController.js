/**
 * Nelum AI Products Component Controller
 */
import { appState } from '../../state/appState.js';
import { uiController } from '../common/uiController.js';
import { kaprukaClient } from '../../api/kaprukaClient.js';
import { eventBus } from '../../utils/eventBus.js';
import { EVENTS } from '../../constants/event.constants.js';

export const productsController = {
  /**
   * Composes custom discounted bundles from search matches dynamically.
   */
  generateDynamicBundles(liveProducts) {
    const cakes = liveProducts.filter(p => p.category === 'cakes' || p.id.toLowerCase().startsWith('cake'));
    const flowers = liveProducts.filter(p => p.category === 'flowers' || p.id.toLowerCase().startsWith('flower') || p.id.toLowerCase().startsWith('ef_pc_flow'));
    
    const bundles = [];
    
    if (cakes.length > 0 && flowers.length > 0) {
      const cake = cakes[0];
      const flower = flowers[0];
      
      const b1Price = Math.round((cake.price + flower.price) * 0.9);
      bundles.push({
        id: "b1",
        title: "Birthday Delight Surprise Bundle",
        price: b1Price,
        originalPrice: cake.price + flower.price,
        category: "birthday",
        image: "src/assets/images/birthday_bundle.png",
        badge: "Most Loved Surprise",
        deliveryEstimate: "Today (Within 3 Hours)",
        items: [
          `${cake.title}`,
          `${flower.title}`,
          "Premium Printed Birthday Greeting Card"
        ],
        description: `The ultimate birthday setup! Combines our bestselling fresh ${cake.title} with the elegant ${flower.title} and a customized card.`
      });
      
      const b2Price = Math.round(flower.price * 1.15);
      bundles.push({
        id: "b2",
        title: "Sincere Apologies Sympathy Set",
        price: b2Price,
        originalPrice: Math.round(flower.price * 1.25),
        category: "sorry",
        image: "src/assets/images/sorry_bundle.png",
        badge: "Empathetic Choice",
        deliveryEstimate: "Today (Same Day)",
        items: [
          `${flower.title}`,
          "Chocolates & Joy Gift Box",
          "Elegant Handwritten Apology Card"
        ],
        description: `Say 'I'm sorry' with pure elegance. Combines the beautiful ${flower.title} with comforting chocolates and a handwritten card.`
      });
    } else {
      const items = liveProducts.slice(0, 2);
      if (items.length >= 2) {
        const item1 = items[0];
        const item2 = items[1];
        const bPrice = Math.round((item1.price + item2.price) * 0.9);
        bundles.push({
          id: "b1",
          title: "Nelum Celebration Surprise Bundle",
          price: bPrice,
          originalPrice: item1.price + item2.price,
          category: "birthday",
          image: "src/assets/images/birthday_bundle.png",
          badge: "Curated Bundle",
          deliveryEstimate: "Today (Same Day)",
          items: [
            `${item1.title}`,
            `${item2.title}`,
            "Special Occasion Greeting Card"
          ],
          description: `A custom curated combination featuring ${item1.title} and ${item2.title}.`
        });
      }
    }
    
    appState.setCurrentBundles(bundles);
    return bundles;
  },

  /**
   * Retrieves product properties and opens the modal.
   */
  async showProductDetail(productId) {
    try {
      const product = await kaprukaClient.getProduct(productId);
      if (!product) return;

      // Emit event: PRODUCT_SELECTED
      eventBus.emit(EVENTS.PRODUCT_SELECTED, { product });

      const detailBadge = document.getElementById("detail-badge");
      const detailTitle = document.getElementById("detail-title");
      const detailReviews = document.getElementById("detail-reviews");
      const detailPrice = document.getElementById("detail-price");
      const detailDesc = document.getElementById("detail-desc");
      const detailDelivery = document.getElementById("detail-delivery");
      const detailSpecs = document.getElementById("detail-specs");
      const detailImage = document.getElementById("detail-image");
      const thumb1 = document.getElementById("thumb-1");
      const thumb2 = document.getElementById("thumb-2");
      const thumb3 = document.getElementById("thumb-3");
      const btnDetailAdd = document.getElementById("btn-detail-add");
      const productDetailModal = document.getElementById("product-detail-modal");

      if (detailBadge) {
        detailBadge.style.display = product.badge ? "inline-block" : "none";
        if (product.badge) detailBadge.textContent = product.badge;
      }
      
      if (detailTitle) detailTitle.textContent = product.title;
      if (detailReviews) detailReviews.textContent = `(${product.reviews} reviews)`;
      if (detailPrice) detailPrice.textContent = `Rs. ${product.price.toLocaleString()}`;
      if (detailDesc) detailDesc.textContent = product.description;
      if (detailDelivery) {
        detailDelivery.innerHTML = `
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>Delivery estimate: <strong>${product.deliveryEstimate}</strong></span>
        `;
      }

      if (detailSpecs) {
        detailSpecs.innerHTML = (product.specs || []).map(spec => `<li>${spec}</li>`).join("");
      }

      if (detailImage) detailImage.src = product.image;
      if (thumb1) thumb1.src = product.image;
      if (thumb2) thumb2.src = product.image;
      if (thumb3) thumb3.src = product.image;

      if (btnDetailAdd) {
        btnDetailAdd.setAttribute("data-id", product.id);
        btnDetailAdd.setAttribute("data-is-bundle", "false");
      }

      if (productDetailModal) productDetailModal.style.display = "flex";
    } catch (err) {
      console.error("Error showing product details:", err);
      uiController.showToast("Could not retrieve live product details.");
    }
  },

  /**
   * Retrieves bundle configurations and opens the modal.
   */
  showBundleDetail(bundleId) {
    const currentBundles = appState.getCurrentBundles();
    const bundle = currentBundles.find(b => b.id === bundleId);
    if (!bundle) return;

    // Emit event: PRODUCT_SELECTED
    eventBus.emit(EVENTS.PRODUCT_SELECTED, { product: bundle, isBundle: true });

    const detailBadge = document.getElementById("detail-badge");
    const detailTitle = document.getElementById("detail-title");
    const detailReviews = document.getElementById("detail-reviews");
    const detailPrice = document.getElementById("detail-price");
    const detailDesc = document.getElementById("detail-desc");
    const detailDelivery = document.getElementById("detail-delivery");
    const detailSpecs = document.getElementById("detail-specs");
    const detailImage = document.getElementById("detail-image");
    const thumb1 = document.getElementById("thumb-1");
    const thumb2 = document.getElementById("thumb-2");
    const thumb3 = document.getElementById("thumb-3");
    const btnDetailAdd = document.getElementById("btn-detail-add");
    const productDetailModal = document.getElementById("product-detail-modal");

    if (detailBadge) {
      detailBadge.style.display = "inline-block";
      detailBadge.textContent = bundle.badge || "Special Bundle";
    }
    
    if (detailTitle) detailTitle.textContent = bundle.title;
    if (detailReviews) detailReviews.textContent = `(Surprise Package)`;
    if (detailPrice) detailPrice.textContent = `Rs. ${bundle.price.toLocaleString()}`;
    if (detailDesc) detailDesc.textContent = bundle.description;
    if (detailDelivery) {
      detailDelivery.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span>Delivery estimate: <strong>${bundle.deliveryEstimate}</strong></span>
      `;
    }

    if (detailSpecs) {
      detailSpecs.innerHTML = bundle.items.map(item => `<li>${item}</li>`).join("");
    }

    if (detailImage) detailImage.src = bundle.image;
    if (thumb1) thumb1.src = bundle.image;
    if (thumb2) thumb2.src = bundle.image;
    if (thumb3) thumb3.src = bundle.image;

    if (btnDetailAdd) {
      btnDetailAdd.setAttribute("data-id", bundle.id);
      btnDetailAdd.setAttribute("data-is-bundle", "true");
    }

    if (productDetailModal) productDetailModal.style.display = "flex";
  }
};

export default productsController;
