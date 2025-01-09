document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#submit').addEventListener('click', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function send_email(event){
  event.preventDefault();
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      if (result.error){
        // Show compose view and hide other views
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#email-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'block';

        document.querySelector('#compose-recipients').value = '';
        document.querySelector('#compose-recipients').placeholder = result.error;
        document.querySelector('#compose-recipients'),className = 'Error'
        document.querySelector('#compose-recipients').focus();
      }else{
        load_mailbox('sent');
      }
  });
}

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';


  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function show_email(id){
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  
  function reply_email(){
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    
    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      document.querySelector('#compose-recipients').value = email.sender;
      //checking that if "Re: " is already present in the subject or not
      if(email.subject.slice(0,4) === "Re: "){
        document.querySelector('#compose-subject').value = email.subject;
      }else{
        document.querySelector('#compose-subject').value = "Re: " + email.subject;
      }
      document.querySelector('#compose-body').value = "\n--------------------------------\nOn " + email.timestamp + " " + email.sender + " wrote: " + email.body;
    });
  }

  function mark_archive(){
    //marking the email archived
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: true
      })
    })
    location.reload(true);
    //I had to use this reload function because  I guess that JavaScript is operating on the already-loaded DOM, and it doesn’t know the server-side data has changed
    load_mailbox('inbox');
  }

  function mark_unarchive(){
    //marking the emial unarchived
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: false
      })
    })
    location.reload(true);
    //I had to use this reload function because  I guess that JavaScript is operating on the already-loaded DOM, and it doesn’t know the server-side data has changed
    load_mailbox('inbox');
  }

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    console.log(email);
    //checking if the email is not in the sent section of the user
    fetch('/emails/sent')
    .then(response => response.json())
    .then(emails => {
      emails.forEach(random => {
        if(random.id === email.id){
          //hiding the archive button beause the email was sent by the user only
          document.querySelector('#archive').style.display = 'none';
        }
      })
    });
    //checking if the email is archived or unarchived and displaying the buttons accordingly
    document.querySelector('#archive').innerHTML = email.archived? 'Unarchive':'Archive';

    document.querySelector('#email-From').innerHTML = `<strong>From: </strong> ${email.sender}`;
    document.querySelector('#email-To').innerHTML = `<strong>To: </strong> ${email.recipients}`;
    document.querySelector('#email-Subject').innerHTML = `<strong>Subject: </strong> ${email.subject}`;
    document.querySelector('#email-Timestamp').innerHTML = `<strong>Timestamp: </strong> ${email.timestamp}`;
    //formatting the '\n' to '<br>' so that the new line comes in the shown email body
    var email_body = email.body;
    var formatted_body = email_body.replace(/\n/g, '<br>');
    document.querySelector('#email-Body').innerHTML = formatted_body;

    //marking the email read
    if(!email.read){
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }

    //assigning the functions defined above to the buttons
    document.querySelector('#reply').addEventListener('click', reply_email);
    document.querySelector('#archive').addEventListener('click', email.archived? mark_unarchive: mark_archive);
  });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
    if(emails.length === 0){
      const something = document.createElement('div');
      var term = "";
      if(mailbox === 'sent'){
        term = 'sentbox';
      }else if(mailbox === 'archive'){
        term = 'archived emails';
      }else{
        term = 'inbox';
      }
      something.innerHTML = "Nothing in your " + term + " yet!"
      document.querySelector('#emails-view').append(something);
    }else{
      emails.forEach(element => {
        const something = document.createElement('div');
        something.innerHTML = `<span id="list-sender">${element.sender}</span><span id="list-subject">${element.subject}</span><span id="list-timestamp">${element.timestamp}</span>`;
        something.addEventListener('click', function() {
          show_email(element.id)
        });
        if(element.read === true){
          something.className = "list";
        }else{
          something.className = "list-unread";
        }
        document.querySelector('#emails-view').append(something);
      });
    }
  });
}