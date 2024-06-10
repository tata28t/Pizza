/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

let PIZZERIA_ID, currImgData, currOrderList;

function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);

    // Switch screens buttons setup
    document.querySelectorAll(".botao-trocar-tela")
        .forEach(btnSwitchScreen => btnSwitchScreen.addEventListener("click", changeScreen))

    document.getElementById("salvar-pedido").addEventListener("click", savePizza)
    document.getElementById("salvar-pedido").addEventListener("click", changeScreen)

    document.getElementById("deletar-pedido").addEventListener("click", deletePizza)
    document.getElementById("deletar-pedido").addEventListener("click", changeScreen)

    document.getElementById("novo-pedido").addEventListener("click", function () {
        switchEditForm()
    })

    document.getElementById("tirar-foto").addEventListener("click", takePicture)

    currImgData = ""
    PIZZERIA_ID = "thales"
    currOrderList = []

    listOrders()
}

function changeScreen(btn) {
    let { nextScreen, originScreen } = btn.srcElement.dataset

    document.getElementById(originScreen).classList.add("hidden")
    document.getElementById(nextScreen).classList.remove("hidden")

    currImgData = "";
}

function listOrders() {
    cordova.plugin.http.get("https://pedidos-pizzaria.glitch.me/admin/pizzas/" + PIZZERIA_ID,
        {}, {},
        function (okResponse) {
            updateOrderList(JSON.parse(okResponse.data))
        },
        function (errResponse) {
            console.log({ errResponse })
            alert("erro pedidos")
        })

}

function updateOrderList(orders) {
    let orderList = document.querySelector(".pedidos")

    orderList.innerHTML = ""

    for (let i = 0; i < orders.length; i++) {
        const order = orders[i];

        let orderItemElement = document.createElement('div')

        orderItemElement.classList.add('order-item')

        orderItemElement.appendChild(generatePicturePreviewElement(order))
        orderItemElement.appendChild(generateOrderTitle(order))

        orderItemElement.onclick = function () {
            switchEditForm(order)
        }

        orderList.appendChild(orderItemElement)
    }
}

function generateOrderTitle(order) {
    let fmtPrice = order.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    let orderTitle = document.createElement('h2')
    orderTitle.classList.add('order-name')
    orderTitle.innerText = `${order.pizza} | ${fmtPrice}`

    return orderTitle
}

function generatePicturePreviewElement(order, element) {
    let orderItemElement = document.createElement('div')

    if (order.imagem.startsWith('data:image/jpeg;base64,')) {
        orderItemElement.classList.add('order-picture')
        orderItemElement.style.backgroundImage = 'url(' + order.imagem + ')'
        orderItemElement.style.backgroundRepeat = 'no-repeat'
        orderItemElement.style.backgroundPosition = 'center'
        orderItemElement.style.backgroundSize = 'cover'
    } else {
        orderItemElement.classList.add('order-picture', 'placeholder')
    }

    return orderItemElement
}

function switchEditForm(order) {
    console.log({ order })
    let orderNameInput = document.getElementById('nome-pizza')
    let orderPriceInput = document.getElementById('preco-pizza')
    let picturePreview = document.getElementById('imagem-pedido')
    let savePizzaBtn = document.getElementById("salvar-pedido")
    let deletePizzaBtn = document.getElementById("deletar-pedido")

    savePizzaBtn.removeEventListener("click", savePizza)
    savePizzaBtn.removeEventListener("click", updatePizza)

    if (order) {
        orderNameInput.value = order.pizza
        orderPriceInput.value = order.preco
        picturePreview.style.backgroundImage = order.imagem.startsWith('data:image/jpeg;base64,') ? 'url(' + order.imagem + ')' : 'url(../img/pizza.jpg)'
        savePizzaBtn.addEventListener("click", function () {
            updatePizza(order["_id"])
        })
        deletePizzaBtn.classList.remove("hidden")
    } else {
        orderNameInput.value = ''
        orderPriceInput.value = ''
        picturePreview.style.backgroundImage = ''
        savePizzaBtn.addEventListener("click", savePizza)
        deletePizzaBtn.classList.add("hidden")
    }

    //btn.srcElement.dataset
    changeScreen({ srcElement: { dataset: { nextScreen: 'tela-novo-pedido', originScreen: 'lista-pedido' } } })

    currImgData = order ? order.imagem : ""
}

function savePizza() {
    let pizzaName = document.querySelector("#nome-pizza").value
    let pizzaPrice = Number.parseFloat(document.querySelector("#preco-pizza").value)

    console.log({ PIZZERIA_ID, pizzaName, pizzaPrice, currImgData })

    cordova.plugin.http.setDataSerializer('json');

    cordova.plugin.http.post("https://pedidos-pizzaria.glitch.me/admin/pizza",
        {
            pizzaria: PIZZERIA_ID,
            pizza: pizzaName,
            preco: pizzaPrice,
            // imagem: currImgData
            imagem: "TODO: REMOVE PLACEHOLDER"
        },
        {},
        function (okResponse) {
            console.log({ okResponse })
            listOrders()
            alert("Successfuly saved order")
        },
        function (errResponse) {
            console.log({ errResponse })
            alert("Error saving order")
        })
}

function updatePizza(orderId) {
    let pizzaName = document.querySelector("#nome-pizza").value
    let pizzaPrice = Number.parseFloat(document.querySelector("#preco-pizza").value)

    console.log({ PIZZERIA_ID, orderId, pizzaName, pizzaPrice, currImgData })

    cordova.plugin.http.setDataSerializer('json');

    cordova.plugin.http.put("https://pedidos-pizzaria.glitch.me/admin/pizza",
        {
            pizzaria: PIZZERIA_ID,
            pizzaid: orderId,
            pizza: pizzaName,
            preco: pizzaPrice,
            // imagem: currImgData
            imagem: "TODO: REMOVE UPDATE PLACEHOLDER"
        },
        {},
        function (okResponse) {
            listOrders()
            alert("Successfuly updated order")
        },
        function (errResponse) {
            console.log({ errResponse })
            alert("Error updating order")
        })
}

function takePicture() {
    let preview = document.getElementById("imagem-pedido")

    navigator.camera.getPicture(onSuccess, onFail, {
        quality: 1,
        destinationType: Camera.DestinationType.DATA_URL
    });

    function onSuccess(imageData) {
        currImgData = "'data:image/jpeg;base64," + imageData + "'"
        preview.style.backgroundImage = "url(" + currImgData + ")";
    }

    function onFail(message) {
        alert('Failed because: ' + message);
    }
}

function deletePizza() {
    let pizzaName = document.querySelector("#nome-pizza").value

    console.log({ PIZZERIA_ID, pizzaName })

    cordova.plugin.http.setDataSerializer('json');

    cordova.plugin.http.delete(encodeURI("https://pedidos-pizzaria.glitch.me/admin/pizza/" + PIZZERIA_ID + "/" + pizzaName),
        {}, {},
        function (okResponse) {
            console.log({ okResponse })
            listOrders()
            alert("Successfuly deleted order")
        },
        function (errResponse) {
            console.log({ errResponse })
            alert("Error deleting order")
        })
}