const normalizeCurrency = price => {
  return new Intl.NumberFormat('en-En', {
    currency: 'usd',
    style: 'currency',
  }).format(price);
}

document.querySelectorAll('.price').forEach(node => {
  node.textContent = normalizeCurrency(node.textContent);
});

const $cart = document.querySelector('#cart');
if ($cart) {
  $cart.addEventListener('click', event => {
    if (event.target.classList.contains('js-remove')) {
      const id = event.target.dataset.id;

      fetch(`/cart/remove/${id}`, {
        method: 'delete',
      })
      .then(res => res.json())
      .then(cart => {
        if(cart.courses.length){
          const html = cart.courses.map(cours => {
            return `
              <tr>
                <td>${cours.title}</td>
                <td>${cours.count}</td>
                <td>
                  <button class="btn btn-small js-remove" data-id=${cours.id}>Del</button>
                </td>
              </tr>
            `
          }).join('')
          $cart.querySelector('tbody').innerHTML = html
          $cart.querySelector('.price').textContent = normalizeCurrency(cart.price)
        }else{
          $cart.innerHTML = `<p>Cart is empty</p>`
        }
      });
    }
  });
}
