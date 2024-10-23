/*=============== SHOW HIDE PASSWORD LOGIN ===============*/
const passwordAccess = (loginPass, loginEye) =>{
   const inputPassword = document.querySelector(`#${loginPass}`);
    const iconEye = document.querySelector(`#${loginEye}`);

   if(iconEye != null){
      iconEye.addEventListener('click', () =>{
         // Change password to text
         input.type === 'password' ? input.type = 'text'
                                   : input.type = 'password'
   
         // Icon change
         iconEye.classList.toggle('ri-eye-fill')
         iconEye.classList.toggle('ri-eye-off-fill')
      })
   }
}
passwordAccess('password','loginPassword')

/*=============== SHOW HIDE PASSWORD CREATE ACCOUNT ===============*/
const passwordRegister = (loginPass, loginEye) =>{
   const input = document.getElementById(loginPass),
         iconEye = document.getElementById(loginEye)

   if(iconEye != null){
      iconEye.addEventListener('click', () =>{
         // Change password to text
         input.type === 'password' ? input.type = 'text'
                                   : input.type = 'password'
   
         // Icon change
         iconEye.classList.toggle('ri-eye-fill')
         iconEye.classList.toggle('ri-eye-off-fill')
      })
   }
}
passwordRegister('passwordCreate','loginPasswordCreate')

/*=============== SHOW HIDE LOGIN & CREATE ACCOUNT ===============*/
const loginAcessRegister = document.getElementById('loginAccessRegister'),
      buttonRegister = document.getElementById('loginButtonRegister'),
      buttonAccess = document.getElementById('loginButtonAccess')

if(buttonRegister != null){
   buttonRegister.addEventListener('click', () => {
      loginAcessRegister.classList.add('active')
   })
}

if(buttonAccess != null){
   buttonAccess.addEventListener('click', () => {
      loginAcessRegister.classList.remove('active')
   })
}
