// Script pour nettoyer les caches et Service Workers
async function clearAllCaches() {
  try {
    console.log("🧹 Nettoyage des caches en cours...");

    // Supprimer tous les caches
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          console.log("🗑️ Suppression du cache:", cacheName);
          return caches.delete(cacheName);
        })
      );
      console.log("✅ Tous les caches supprimés");
    }

    // Désinscrire tous les Service Workers
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => {
          console.log(
            "🗑️ Désinscription du Service Worker:",
            registration.scope
          );
          return registration.unregister();
        })
      );
      console.log("✅ Tous les Service Workers désinscrits");
    }

    console.log("🎉 Nettoyage terminé ! Rechargez la page.");
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
  }
}

// Fonction pour réenregistrer le Service Worker
async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      console.log("✅ Service Worker enregistré:", registration.scope);

      // Écouter les mises à jour
      registration.addEventListener("updatefound", () => {
        console.log("🔄 Nouvelle version du Service Worker détectée");
      });
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'enregistrement du Service Worker:",
        error
      );
    }
  }
}

// Exporter les fonctions pour utilisation dans la console
window.clearAllCaches = clearAllCaches;
window.registerServiceWorker = registerServiceWorker;

console.log(`
🛠️ Outils de débogage disponibles :
- clearAllCaches() : Nettoie tous les caches et SW
- registerServiceWorker() : Réenregistre le Service Worker
`);
