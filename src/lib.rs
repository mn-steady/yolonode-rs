use leptos::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use js_sys::{Promise, Reflect, Function};
use wasm_bindgen::JsValue;

// Helper function to call JavaScript functions on the `window` object
fn call_js_function(function_name: &str) -> Result<Function, JsValue> {
    let window = web_sys::window().expect("no global `window` exists");
    let func = Reflect::get(&window, &JsValue::from_str(function_name))?;
    func.dyn_into::<Function>()
}

// Call specific JavaScript functions
async fn get_wallet_address() -> Option<String> {
    if let Ok(js_func) = call_js_function("get_wallet_address") {
        if let Ok(promise) = js_func.call0(&web_sys::window().unwrap()).and_then(|val| val.dyn_into::<Promise>()) {
            if let Ok(js_value) = wasm_bindgen_futures::JsFuture::from(promise).await {
                return js_value.as_string();
            }
        }
    }
    None
}

fn disconnect_keplr_wallet() {
    if let Ok(js_func) = call_js_function("disconnectKeplrWallet") {
        js_func.call0(&web_sys::window().unwrap()).ok();
    }
}

// Function to fetch and SHD price from Oracle contract
async fn fetch_shd_price(set_shd_price: WriteSignal<String>) {
    let window = web_sys::window().expect("no global `window` exists");
    let func = js_sys::Reflect::get(&window, &JsValue::from_str("fetchSHDPrice"))
        .expect("fetchSHDPrice function not found")
        .dyn_into::<js_sys::Function>()
        .expect("fetchSHDPrice is not a function");

    // Call the JavaScript function, expecting a Promise
    let promise = func.call0(&JsValue::NULL)
        .expect("Error invoking fetchSHDPrice")
        .dyn_into::<js_sys::Promise>()
        .expect("Expected a Promise from fetchSHDPrice");

    match wasm_bindgen_futures::JsFuture::from(promise).await {
        Ok(price) => {
            if let Some(price_str) = price.as_string() {
                set_shd_price.set(format!("SHD = ${}", price_str));
            } else {
                set_shd_price.set("Price data unavailable".to_string());
            }
        }
        Err(err) => {
            web_sys::console::error_1(&err);
            set_shd_price.set("Error fetching SHD price".to_string());
        }
    }
}

// Function to fetch and set the STKD viewing key
async fn fetch_stkd_viewing_key(set_stkd_viewing_key: WriteSignal<String>, wallet_address: String) {
    if let Ok(js_func) = call_js_function("getSTKDViewingKey") {
        let promise = js_func.call1(&JsValue::NULL, &JsValue::from_str(&wallet_address)).unwrap();
        match wasm_bindgen_futures::JsFuture::from(promise.dyn_into::<js_sys::Promise>().unwrap()).await {
            Ok(key) => {
                if let Some(viewing_key) = key.as_string() {
                    set_stkd_viewing_key.set(viewing_key);
                } else {
                    set_stkd_viewing_key.set("Viewing key unavailable".to_string());
                }
            }
            Err(err) => {
                web_sys::console::error_1(&err);
                set_stkd_viewing_key.set("Error retrieving STKD viewing key".to_string());
            }
        }
    }
}

// The main app component
#[component]
pub fn App(cx: Scope) -> impl IntoView {
    let (is_connected, set_connected) = create_signal(cx, false);
    let (wallet_address, set_wallet_address) = create_signal(cx, String::from("Not connected"));
    let (shd_price, set_shd_price) = create_signal(cx, String::from("Loading SHD price..."));
    let (stkd_viewing_key, set_stkd_viewing_key) = create_signal(cx, String::from("Fetching STKD viewing key..."));
    let (selected_section, set_selected_section) = create_signal(cx, "Home".to_string());

    let connect_wallet = move |_| {
        set_connected.set(true);
        spawn_local(async move {
            if let Some(address) = get_wallet_address().await {
                set_wallet_address.set(address);
            }
        });
    };

    let disconnect_wallet = move |_| {
        disconnect_keplr_wallet();
        set_connected.set(false);
        set_wallet_address.set(String::from("Not connected"));
    };

    let refresh_price = move |_| {
        spawn_local(fetch_shd_price(set_shd_price.clone()));
    };

    // Check STKD viewing key when in "Keplr" view
    let fetch_stkd_key = move |_| {
        let wallet_address = wallet_address.get();
        if !wallet_address.is_empty() && wallet_address != "Not connected" {
            spawn_local(fetch_stkd_viewing_key(set_stkd_viewing_key.clone(), wallet_address.to_string()));
        }
    };

    // UI with views
    view! {
        cx,
        <div class="container">
            <div class="top-bar">
                <a href="https://yoloproto.com" class="logo">"YoloProto"</a>
                {move || if is_connected.get() {
                    view! { cx,
                        <button class="connect-wallet" on:click=disconnect_wallet>
                            "Logout"
                        </button>
                    }
                } else {
                    view! { cx,
                        <button class="connect-wallet" on:click=connect_wallet>
                            "Connect Wallet"
                        </button>
                    }
                }}
            </div>
            <hr class="gold-line" />
            <div class="links-wallet-container">
                <div class="links">
                    <button class="link-button" on:click=move |_| set_selected_section.set("Home".to_string())>"Home"</button>
                    <button class="link-button" on:click=move |_| set_selected_section.set("Keplr".to_string())>"Keplr"</button>
                    <button class="link-button" on:click=move |_| set_selected_section.set("Shade".to_string())>"Shade"</button>
                </div>
                <div class="wallet-address">
                    {move || if is_connected.get() {
                        view! { cx, 
                            <span>"SCRT Address: " {wallet_address.get()}</span>
                        }
                    } else {
                        view! { cx, 
                            <span>{wallet_address.get()}</span>
                        }
                    }}
                </div>
            </div>
            <hr class="gold-line" />

            {move || if selected_section.get() == "Home" {
                view! { cx, 
                    <div>
                        <img src="./static/mn-steady.png" class="main-page-image" alt="Main Page Image" />
                    </div>
                }
            } else if selected_section.get() == "Keplr" {
                view! { cx, 
                    <div class="section-content">
                        <button on:click=fetch_stkd_key>"Get STKD Viewing Key"</button>
                        <div>"STKD Viewing Key: " {stkd_viewing_key.get()}</div>
                    </div>
                }
            } else {
                view! {
                    cx,
                    <div class="section-content">
                        <div id="shd-price" class="price-display">{shd_price.get()}</div>
                        <button class="refresh-price" on:click=refresh_price>"Refresh SHD Price"</button>
                    </div>
                }                                                 
            }}
        </div>
    }
}

#[wasm_bindgen(start)]
pub fn start() {
    mount_to_body(|cx| view! { cx, <App /> });
}
