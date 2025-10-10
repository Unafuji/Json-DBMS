export function initResponds() {
    console.log("✅ initResponds called");

    const caretItems = document.querySelectorAll(".tree-menu-resp .caret-resp");

    console.log("Found caret items:", caretItems.length);

    caretItems.forEach(caret => {
        caret.addEventListener("click", function () {
            console.log("🡺 Caret clicked");

            this.classList.toggle("caret-down-resp");

            const nested = this.nextElementSibling;
            if (nested && nested.classList.contains("nested-resp")) {
                nested.classList.toggle("active-resp");
            }
        });
    });
}
