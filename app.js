const sessionTimeout = 1 * 60 * 1000;
function sendMessage(phone_number_id, data) {
  let url =
    "https://graph.facebook.com/v16.0/" +
    phone_number_id +
    "/messages?access_token=" +
    token;
  axios({
    method: "POST",
    url: url,
    data: data,
    headers: { "Content-Type": "application/json" },
  })
    .then(function (response) {
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });
}
const formatterRp = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
});

let asd;
const cart = { data: [] };
const catalogid = [];
const token = process.env.WHATSAPP_TOKEN;
const sessions = {}; // Object to store session data
const route = [];
const apiUrl = process.env.API_URL;
let result;

const express = require("express"),
  body_parser = require("body-parser"),
  axios = require("axios").default,
  app = express().use(body_parser.json());

app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

const fetchItems = async () => {
  try {
    const response = await axios.get(apiUrl + "items");
    return response.data.data;
  } catch (error) {
    console.error(error);
  }
};
const items = async () => {
  try {
    result = await fetchItems();
  } catch (error) {
    console.error(error);
  }
};

items();

const session = {};
function cartFunc(id, from) {
  axios.get(apiUrl + "items").then(async (resp) => {
    const { data } = resp.data;
    let cartL = cart.data.length;
    let dataL = data.length;
    let keranjang = [];
    for (let i = 0; i < cartL; i++) {
      if (cart.data[i].wa == from) {
        for (let k = 0; k < dataL; k++) {
          if (cart.data[i].item == data[k].itemNo) {
            let str = `${keranjang.length + 1} . [${data[k].itemGroup}] : [${
              cart.data[i].index
            }] ${data[k].subJenis} | ${data[k].itemDesc} | QTY : ${
              cart.data[i].qty
            }`;
            keranjang.push(str);
          }
        }
      }
    }
    keranjang = keranjang.join("\n\n");
    console.log(keranjang);
    var button = JSON.stringify({
      messaging_product: "whatsapp",
      to: from,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: "##### Keranjang 🛒 #####\n\n" + keranjang.toString(),
        },
        footer: {
          text: "StarPart Motor ~ The Bigest Supplier in West Java",
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "ConfirmCart",
                title: "Confirm Cart",
              },
            },
            {
              type: "reply",
              reply: {
                id: "EditCart",
                title: "Edit Cart",
              },
            },
          ],
        },
      },
    });
    sendMessage(id, button);
  });
}

function sessionMiddleware(sessionTimeout) {
  return function (req, res, next) {
    if (req.body.object) {
      if (
        req.body.entry &&
        req.body.entry[0].changes &&
        req.body.entry[0].changes[0] &&
        req.body.entry[0].changes[0].value.messages &&
        req.body.entry[0].changes[0].value.messages[0]
      ) {
        const phoneNumber = req.body.entry[0].changes[0].value.messages[0].from;
        console.log("ini cek nomornya masuk apa engga " + phoneNumber);
        const phoneNumberID =
          req.body.entry[0].changes[0].value.metadata.phone_number_id;
        const sessionId =
          req.body.sessionId || getSessionIdFromPhoneNumber(phoneNumber);
        if (sessionId && sessions[sessionId]) {
          const session = sessions[sessionId];

          const currentTime = new Date().getTime();
          if (currentTime - session.lastAccessTime > sessionTimeout) {
            delete sessions[sessionId];
            req.session = null;
          } else {
            session.lastAccessTime = currentTime;
            session.phoneNumber = phoneNumber;
            req.session = session.data;
          }
        } else {
          const newSessionId = generateSessionId();
          const currentTime = new Date().getTime();
          const newSession = {
            sessionId: newSessionId,
            creationTime: currentTime,
            lastAccessTime: currentTime,
            phoneNumber: phoneNumber,
            phoneNumberID: phoneNumberID,
            data: {},
          };
          sessions[newSessionId] = newSession;
          req.session = newSession.data;
        }
        next();
      }
    }
  };
}

function getSessionIdFromPhoneNumber(phoneNumber) {
  const sessionIds = Object.keys(sessions);
  for (let i = 0; i < sessionIds.length; i++) {
    const sessionId = sessionIds[i];
    const session = sessions[sessionId];
    if (session.phoneNumber === phoneNumber) {
      return sessionId;
    }
  }
  return null;
}

function deleteSession(phoneNumber) {
  const sessionIds = Object.keys(sessions);
  for (let i = 0; i < sessionIds.length; i++) {
    const sessionId = sessionIds[i];
    const session = sessions[sessionId];
    if (session.phoneNumber === phoneNumber) {
      delete sessions[session];
    }
  }
}

function getFromPhoneNumber(phoneNumber) {
  const sessionIds = Object.keys(sessions);
  for (let i = 0; i < sessionIds.length; i++) {
    const sessionId = sessionIds[i];
    const session = sessions[sessionId];
    if (session.phoneNumber === phoneNumber) {
      return session.phoneNumber;
    }
  }
  return null;
}
function generateSessionId() {
  const uuid = require("uuid");
  return uuid.v4();
}

app.post("/webhook", sessionMiddleware(sessionTimeout), (req, res) => {
  let body = req.body;
  console.log(JSON.stringify(req.body, null, 2));

  if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      let phone_number_id =
        req.body.entry[0].changes[0].value.metadata.phone_number_id;
      let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
      let type_message = req.body.entry[0].changes[0].value.messages[0].type;
      let text;
      let items;
      if (type_message == "text") {
        let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body;
        text = msg_body;
      } else if (type_message == "interactive") {
        let msg_body =
          req.body.entry[0].changes[0].value.messages[0].interactive
            .button_reply.id;
        items = msg_body;
      }
      console.log(
        route.some((route) => route.wa === from && route.data === "orderItems")
      );
      if (items == "mulaiCheck") {
        console.log("masuk button");
        axios.get(apiUrl + "user?phone=" + from).then(async (response) => {
          // console.log(response.data);
          const { success, data } = response.data;
          if (success) {
            // items part
            var name = data.name;
            var type = data.type;
            var id = data.id;
            route.push({
              wa: from,
              name: name,
              id: id,
            });
            if (type == "Customer") {
              var str =
                "Hallo " +
                name +
                "! \n\nSilahkan pilih Menu yang tersedia dibawah ini:";
              var button = JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: from,
                type: "interactive",
                interactive: {
                  type: "button",
                  body: {
                    text: str,
                  },
                  footer: {
                    text: "StarPart Motor ~ The Bigest Supplier in West Java",
                  },
                  action: {
                    buttons: [
                      {
                        type: "reply",
                        reply: {
                          id: "Order",
                          title: "Order",
                        },
                      },
                      {
                        type: "reply",
                        reply: {
                          id: "CheckAR",
                          title: "CheckAR",
                        },
                      },
                    ],
                  },
                },
              });
              sendMessage(phone_number_id, button);
            } else if (type == "Sales") {
              var str =
                "Hallo sales " +
                name +
                "! \n\nSilahkan pilih Menu yang tersedia dibawah ini:";
              var button = JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: from,
                type: "interactive",
                interactive: {
                  type: "button",
                  body: {
                    text: str,
                  },
                  footer: {
                    text: "StarPart Motor ~ The Bigest Supplier in West Java",
                  },
                  action: {
                    buttons: [
                      {
                        type: "reply",
                        reply: {
                          id: "Regis",
                          title: "Register Outlet",
                        },
                      },
                      {
                        type: "reply",
                        reply: {
                          id: "ListOut",
                          title: "List Outlet",
                        },
                      },
                      {
                        type: "reply",
                        reply: {
                          id: "upAr",
                          title: "Request Up AR",
                        },
                      },
                    ],
                  },
                },
              });
              sendMessage(phone_number_id, button);
            }

            // break;
          } else {
            let data = JSON.stringify({
              messaging_product: "whatsapp",
              to: from,
              text: {
                body: "Mohon maaf nomor anda belum terdaftar di aplikasi ini, \nsilahkan menghubungi admin kami.",
              },
            });
            sendMessage(phone_number_id, data);
            deleteSession(from);
          }
        });
      }
      // console.log(test);
      else if (!route.some((route) => route.wa === from)) {
        let data = JSON.stringify({
          messaging_product: "whatsapp",
          to: from,
          type: "interactive",
          interactive: {
            type: "button",
            body: {
              text: "Selamat Datang di StarPart. \n\nIni Robot Order. \n\nSilahkan pilih button dibawah ini untuk melakukan pemesanan.",
            },
            footer: {
              text: "StarPart Motor ~ The Bigest Supplier in West Java",
            },
            action: {
              buttons: [
                {
                  type: "reply",
                  reply: {
                    id: "mulaiCheck",
                    title: "Mulai",
                  },
                },
              ],
            },
          },
        });
        sendMessage(phone_number_id, data);
      } else {
        if (items) {
          switch (items) {
            case "CheckAR":
              var index = route.findIndex((x) => x.wa == from);
              var id = route[index].id;
              var name = route[index].name;
              axios
                .get(
                  apiUrl + "AR?id=" + id + "&name=" + name + "&phone=" + from
                )
                // )
                .then(async (response) => {
                  console.log(response.data);
                  const { success, data } = response.data;
                  // console.log(data.COMPANY_NAME);
                });
              break;

            case "Order":
              var button = JSON.stringify({
                messaging_product: "whatsapp",
                to: from,
                type: "interactive",
                interactive: {
                  type: "button",
                  body: {
                    text: "Silahkan pilih Menu yang tersedia dibawah ini:",
                  },
                  footer: {
                    text: "StarPart Motor ~ The Bigest Supplier in West Java",
                  },
                  action: {
                    buttons: [
                      {
                        type: "reply",
                        reply: {
                          id: "Catalog",
                          title: "Catalog",
                        },
                      },
                      {
                        type: "reply",
                        reply: {
                          id: "OrderTer",
                          title: "Orderan Terakhir",
                        },
                      },
                    ],
                  },
                },
              });
              sendMessage(phone_number_id, button);
              break;

            case "Catalog":
              var button = JSON.stringify({
                messaging_product: "whatsapp",
                to: from,
                type: "interactive",
                interactive: {
                  type: "button",
                  body: {
                    text: "Silahkan pilih Menu yang tersedia dibawah ini:",
                  },
                  footer: {
                    text: "StarPart Motor ~ The Bigest Supplier in West Java",
                  },
                  action: {
                    buttons: [
                      {
                        type: "reply",
                        reply: {
                          id: "FDR",
                          title: "FDR",
                        },
                      },
                      {
                        type: "reply",
                        reply: {
                          id: "2W",
                          title: "OSRAM 2W",
                        },
                      },
                      {
                        type: "reply",
                        reply: {
                          id: "4W",
                          title: "OSRAM 4W",
                        },
                      },
                    ],
                  },
                },
              });
              sendMessage(phone_number_id, button);
              break;

            case "FDR":
              var button = JSON.stringify({
                messaging_product: "whatsapp",
                to: from,
                type: "interactive",
                interactive: {
                  type: "button",
                  body: {
                    text: "Silahkan pilih Menu yang tersedia dibawah ini:",
                  },
                  footer: {
                    text: "StarPart Motor ~ The Bigest Supplier in West Java",
                  },
                  action: {
                    buttons: [
                      {
                        type: "reply",
                        reply: {
                          id: "TL",
                          title: "TL : Tubeless Type",
                        },
                      },
                      {
                        type: "reply",
                        reply: {
                          id: "TT",
                          title: "TT : Tube Type",
                        },
                      },
                    ],
                  },
                },
              });
              sendMessage(phone_number_id, button);
              break;

            case "TT":
              console.log("masuk tt");
              axios
                .get(apiUrl + "item?brand=FDR&jenis=TT")
                .then(async (res) => {
                  console.log("masuk axios");
                  const { success, data } = res.data;
                  console.log(data);
                  let size = res.data.length;
                  // console.log(size);
                  let arr = [];
                  for (let i = 0; i < data.length; i++) {
                    let jenis = data[i].subJenis;
                    let id = data[i].itemNo;
                    let ukuran = data[i].itemUkuran;
                    let pattern = data[i].itemDesc;
                    let type = data[i].itemType;

                    let nomor = arr.length + 1;
                    arr.push(
                      nomor +
                        " . " +
                        jenis +
                        " | " +
                        pattern +
                        " | " +
                        ukuran +
                        " | " +
                        type
                    );
                    catalogid.push(id);
                  }
                  console.log(arr);
                  console.log("catalog id " + catalogid);
                  arr = arr.join("\n");

                  let m = route.findIndex((x) => x.wa === from);
                  route[m].data = "orderItems";
                  console.log(route);

                  let reply = JSON.stringify({
                    messaging_product: "whatsapp",
                    to: from,
                    text: {
                      body: "----- Catalog Items -----\n" + arr.toString(),
                    },
                  });
                  await sendMessage(phone_number_id, reply);
                  let reply2 = JSON.stringify({
                    messaging_product: "whatsapp",
                    to: from,
                    text: {
                      body: "Silahkan kirim chat untuk memesan barang dengan format \n\n[nomer item]=[jumlah barang] \n\ncontoh : 10=25 **tanpa spasi** \n(anda memesan item nomer 10, dengan jumlah barang 25) \n\ncontoh : 10=25,15=20 **tanpa spasi** \n(anda memesan item nomer 10, dengan jumlah barang 25 dan item nomer 15, dengan jumlah barang 20)",
                    },
                  });
                  sendMessage(phone_number_id, reply2);
                });

              break;
          }
        } else if (
          route.some(
            (route) => route.wa === from && route.data === "orderItems"
          )
        ) {
          console.log("---Order Items---");
          console.log("route : ", route);
          console.log("cart : ", cart.data);

          let itemInput,
            choose = [];
          if (text.includes(",")) {
            itemInput = text.split(",");
            for (let m = 0; m < itemInput.length; m++) {
              choose = itemInput[m].split("=");
              let index = parseInt(choose[0] - 1);
              let qty = parseInt(choose[1]);
              if (!isNaN(index && qty)) {
                let o = cart.data.findIndex(
                  (e) => e.item === catalogid[index] && e.wa == from
                );
                if (o != -1) {
                  let qtys = cart.data[o].qty + qty;
                  console.log("ini qtys " + qtys + "ini M " + o);
                  cart.data[o].qty = qtys;
                  cart.data[o].total = cart.data[o].after_diskon * qtys;
                } else {
                  let harga;
                  for (var i = 0; i < result.length; i++) {
                    if (result[i].itemNo === catalogid[index]) {
                      harga = result[i].itemHarga;
                      break; // Keluar dari loop setelah harga ditemukan
                    }
                  }
                  cart.data.push({
                    wa: from,
                    item: catalogid[index].toString(),
                    index: index + 1,
                    qty: qty,
                    harga: harga,
                    diskon: 10, //hardcoded
                    after_diskon: harga * 0.9,
                    total: harga * 0.9 * qty,
                  });
                }
              }
            }
          } else {
            let choose = text.split("=");
            let index = parseInt(choose[0] - 1);
            let qty = parseInt(choose[1]);
            if (!isNaN(index && qty)) {
              let o = cart.data.findIndex(
                (e) => e.item === catalogid[index] && e.wa == from
              );
              if (o != -1) {
                let qtys = cart.data[o].qty + qty;
                console.log("ini qtys " + qtys + "ini M " + o);
                cart.data[o].qty = qtys;
                cart.data[o].total = cart.data[o].after_diskon * qtys;
              } else {
                let harga;
                for (var i = 0; i < result.length; i++) {
                  if (result[i].itemNo === catalogid[index]) {
                    harga = result[i].itemHarga;
                    break; // Keluar dari loop setelah harga ditemukan
                  }
                }
                cart.data.push({
                  wa: from,
                  item: catalogid[index].toString(),
                  index: index + 1,
                  qty: qty,
                  harga: harga,
                  diskon: 10, //hardcoded
                  after_diskon: harga * 0.9,
                  total: harga * 0.9 * qty,
                });
              }
            }
          }
          //total setelah diskon item
          let totalCart = cart.data.reduce(function (
            accumulator,
            currentValue
          ) {
            return accumulator + currentValue.total;
          },
          0);

          let diskonToko = 10; //hardcoded

          //fungsi pembulatan desimal
          function toFixed(number, decimals) {
            const x = Math.pow(10, Number(decimals) + 2);
            return (Number(number) + 1 / x).toFixed(decimals);
          }

          //total setelah diskon toko
          let final = toFixed(totalCart * ((100 - diskonToko) / 100), 4);

          console.log("diskon toko\n", diskonToko);
          console.log("cart\n", cart.data);
          console.log("total semua\n", totalCart);
          console.log("total setelah diskon\n", final);
          cartFunc(phone_number_id, from);
        }
      }
    }
    res.sendStatus(200);
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp API
    res.sendStatus(404);
  }
});

// Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook", (req, res) => {
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
   **/
  const verify_token = process.env.VERIFY_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

setInterval(() => {
  const currentTime = new Date().getTime();
  Object.keys(sessions).forEach((sessionId) => {
    const session = sessions[sessionId];
    // const firstNotif =  5 * 60 * 1000;

    if (currentTime - session.lastAccessTime > sessionTimeout) {
      console.log(currentTime - session.lastAccessTime);
      let data = JSON.stringify({
        messaging_product: "whatsapp",
        to: session.phoneNumber,
        text: {
          body: "Terimakasih telah menghubungi kami",
        },
      });

      sendMessage(session.phoneNumberID, data);
      delete sessions[sessionId];
      let index = route.findIndex((route) => route.wa === session.phoneNumber);
      const x = route.splice(index, 1);

      console.log(sessions);
    }
    //     else if (currentTime - session.lastAccessTime > firstNotif) {
  });
}, sessionTimeout);
