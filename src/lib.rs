use leptos::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use js_sys::{Promise, Reflect, Function};
use wasm_bindgen::JsValue;
use wasm_bindgen::JsCast;
use web_sys::window;
use js_sys::Date;

// Function to open a mailto link with a timestamped subject
fn open_mailto_with_timestamp() {
    if let Some(window) = window() {
        let timestamp = Date::new_0().to_locale_string("en-US", &js_sys::Object::new());
        let mailto_url = format!("mailto:?subject=Bug Report - {}", timestamp);
        window.open_with_url(&mailto_url).unwrap();
    }
}

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

// Function to fetch SHD price from Oracle contract
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

// Function to fetch SCRT price
async fn fetch_scrt_price(set_scrt_price: WriteSignal<String>) {
    if let Ok(js_func) = call_js_function("fetchSCRTPrice") {
        if let Ok(promise) = js_func.call0(&JsValue::NULL).and_then(|val| val.dyn_into::<Promise>()) {
            if let Ok(js_value) = wasm_bindgen_futures::JsFuture::from(promise).await {
                if let Some(price_str) = js_value.as_string() {
                    set_scrt_price.set(format!("SCRT = ${}", price_str));
                }
            }
        }
    }
}

// Function to calculate the price ratio
async fn calculate_price_ratio(shd_price: String, scrt_price: String, set_ratio: WriteSignal<String>) {
    let shd_value = shd_price.trim_start_matches("SHD = $").parse::<f64>().unwrap_or(0.0);
    let scrt_value = scrt_price.trim_start_matches("SCRT = $").parse::<f64>().unwrap_or(1.0); // Avoid division by zero
    if scrt_value > 0.0 {
        let ratio = shd_value / scrt_value;
        set_ratio.set(format!("SHD/SCRT = {:.2}", ratio));
    } else {
        set_ratio.set("Invalid Ratio".to_string());
    }
}

// The main app component
#[component]
pub fn App(cx: Scope) -> impl IntoView {
    let (is_connected, set_connected) = create_signal(cx, false);
    let (wallet_address, set_wallet_address) = create_signal(cx, String::new());
    let (shd_price, set_shd_price) = create_signal(cx, String::from("Loading SHD price..."));
    let (scrt_price, set_scrt_price) = create_signal(cx, String::from("Loading SCRT price..."));
    let (price_ratio, set_price_ratio) = create_signal(cx, String::from("Loading price ratio..."));
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
        set_wallet_address.set(String::new());
    };

    let refresh_price = move |_| {
        spawn_local(fetch_shd_price(set_shd_price.clone()));
    };

        let refresh_scrt_price = move |_| {
        spawn_local(fetch_scrt_price(set_scrt_price.clone()));
    };

    let refresh_price_ratio = move |_| {
        let shd_price_value = shd_price.get();
        let scrt_price_value = scrt_price.get();
        spawn_local(calculate_price_ratio(
            shd_price_value.clone(),
            scrt_price_value.clone(),
            set_price_ratio.clone(),
        ));
    };

    // UI with views
    view! {
        cx,
        <div class="container">
            <div class="top-bar">
            <div class="links">
                <button class="link-button" on:click=move |_| set_selected_section.set("Home".to_string())>"Home"</button>
                <button class="link-button" on:click=move |_| set_selected_section.set("Price API".to_string())>"Price API"</button>
            </div>
            <div class="wallet-info">
                {move || if is_connected.get() {
                    view! { cx,
                        <span class="wallet-address">"SCRT Address: " {wallet_address.get()}</span>
                    }
                } else {
                    view! { cx,
                        <span class="wallet-address">"Producing blocks on Secret Network since 7/10/2024!"</span>
                    }
                }}
            </div>
            {move || if is_connected.get() {
                view! { cx,
                    <button class="link-button" on:click=disconnect_wallet>
                        "Logout"
                    </button>
                }
                } else {
                    view! { cx,
                        <button class="link-button" on:click=connect_wallet>
                            "Connect Wallet"
                        </button>
                    }
                }}
            </div>
            <hr class="gold-line" />
            {move || if selected_section.get() == "Home" {
                view! { cx, 
                    <div>
                        <div class="image-section">
                            <div class="button-container">
                                <a href="https://www.mintscan.io/secret/validators/secretvaloper1pkzmfk34qg46p4hen0dnlkn05rzje65xk4tzjc" 
                                    class="yellow-button"
                                    target="_blank">
                                    "Validator Info"
                                </a>
                                <a href="https://dash.scrt.network/staking" 
                                    class="yellow-button"
                                    target="_blank">
                                    "Stake With Us!"
                                </a>
                            </div>
                        </div>
                        <div class="main-section">
                            <div class="content">
                                <h1>"Web3's future needs privacy, and we're here to validate it!"</h1>
                                <br />
                                <h2>"Why Does Web3 Need Privacy?"</h2>
                                <br />
                                <p>"Traditional blockchains are typically fully transparent, making user data immediately public and available for analysis and research."</p>  
                                <br />
                                <p>"This level of transparency can render Web3 unsuitable for institutional players and can prevent its use entirely."</p>
                                <br />
                                <img src="/static/compliance.webp" alt="Compliance Image" class="main-image" />
                            </div>
                            <div class="content">
                            <h2>"What is Decentralized Confidential Computing (DeCC)?"</h2>
                            <br />
                            <p>
                                "Confidential computing has been around for years but is often mistakenly grouped with privacy chains which obscures its true potential. "
                                <strong>"DeCC"</strong>
                                " is a distinct category that ensures compliance and supports corporate use cases."
                                <br /><br />
                                <strong>"DeCC"</strong>
                                " enables protected computing, allowing arbitrary computations on data without exposing it to the world. Additionally, confidential computing facilitates opt-in compliance. Users can decide who can access their data and when with fine-grained access controls."
                            </p>
                            <br /><br />
                            <img src="/static/decc.webp" alt="DeCC Image" class="main-image" />
                        </div>
                        
                        <div class="content">
                            <h2>"New use cases enabled by DeCC infrastructure:"</h2>
                            <br />
                            <ul class="custom-list">
                                <li>"Decentralized on-chain identity that safeguards data privacy"</li>
                                <li>"Decentralized confidential document sharing"</li>
                                <li>"Verifiable on-chain Random Number Generation (RNG)"</li>
                                <li>"Confidential on-chain voting (e.g., for DAOs)"</li>
                                <li>"Confidential trading strategies for DeFi"</li>
                                <li>"AI model training on confidential data and/or with confidential parameters"</li>
                                <li>"NFTs with protected data, ensuring true ownership of content on Web3"</li>
                                <li>"Sealed-bid auctions for DeFi, DeSci, and NFTs"</li>
                                <li>"Various gaming applications"</li>
                            </ul>
                        </div>
                    
                        <div class="content">
                            <img src="/static/datacenter.webp" alt="DataCenter Image" class="main-image" />
                            <br /><br />
                            <h2>"How does it work?"</h2>
                            <br />
                            <p>
                                "Decentralized Confidential Computing leverages technologies like "
                                <strong>"ZKPs, MPC, FHE,"</strong>
                                " and "
                                <strong>"TEEs"</strong>
                                " for blockchain implementation. These tools enable decentralized confidential computations, securing user data with varying degrees of security, speed, and flexibility."
                                <br /><br />
                                <strong>"Trusted Execution Environments (TEE):"</strong>
                                " TEEs are secure areas within a processor that ensure code and data loaded inside are protected with respect to confidentiality and integrity. They offer fast and secure hardware-dependent computations."
                                <br /><br />
                                <strong>"Zero-Knowledge Proofs (ZKP):"</strong>
                                "  ZKPs allow one party to prove to another that they know a value, without revealing the value itself. For example, proving you have a password without showing the password."
                                <br /><br />
                                <strong>"Multi-Party Computation (MPC):"</strong>
                                "  MPC enables multiple parties to collaboratively compute a function over their inputs while keeping those inputs private. No single party can access all the confidential information."
                                <br /><br />
                                <strong>"Fully-Homomorphic Encryption:"</strong>
                                "  FHE allows computations to be performed on encrypted data without decrypting it. This means you can process data securely without exposing it."
                                <br /><br />
                                <strong>"Each has unique advantages, and combining them will be crucial for DeCC's future."</strong>
                                <br /><br />
                                <a href="https://scrt.network/" class="black-button">"Learn More"</a>
                            </p>
                        </div>
                    
                        <div class="content">
                            <img src="/static/hacker.webp" alt="Hacker Image" class="main-image" />
                            <br /><br />
                            <h2>"Bug Bounty Program"</h2>
                            <br />
                            <p>
                                "We offer a bug bounty reward to individuals who responsibly disclose security vulnerabilities in our systems. By reporting bugs in a responsible manner, you help us maintain the security and integrity of our services."
                                <br /><br />
                                "We value your contributions and will provide a monetary reward for verified vulnerabilities, ensuring that our platform remains safe for all users."
                                <br /><br />
                                "Thank you for helping us improve our security!"
                                <br /><br />
                                <a href="#" class="black-button" on:click=move |_| open_mailto_with_timestamp()>"Report A Bug"</a>
                            </p>
                        </div>
                    
                        <div class="content">
                            <h2>"Join us in building a safe and secure future!"</h2>
                            <br />
                            <a href="https://x.com/Yolo_Node" target="_blank">
                                <img src="/static/x-logo.webp" alt="X Logo" class="social-logo" />
                            </a>
                        </div>
                        </div>
                    </div>
                }
            } else {
                view! {
                    cx,
                    <div class="section-content">
                        <div class="price-row">
                            <button class="link-button" on:click=refresh_price>"Refresh SHD Price"</button>
                            <div id="shd-price" class="price-display">{shd_price.get()}</div>
                        </div>
                        <hr class="gold-line" />
                        <div class="price-row">
                            <button class="link-button" on:click=refresh_scrt_price>"Refresh SCRT Price"</button>
                            <div id="scrt-price" class="price-display">{scrt_price.get()}</div>
                        </div>
                        <hr class="gold-line" />
                        <div class="price-row">
                            <button class="link-button" on:click=refresh_price_ratio>"Refresh Price Ratio"</button>
                            <div id="price-ratio" class="price-display">{price_ratio.get()}</div>
                        </div>
                        <hr class="gold-line" />
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
