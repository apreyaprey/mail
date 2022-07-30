document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);
  document
    .querySelector("#compose-form")
    .addEventListener("submit", send_email);

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#view-email").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
  document.querySelector("#compose-recipients").disabled=false;
}

function send_email(event) {
  event.preventDefault();

  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: document.querySelector("#compose-recipients").value,
      subject: document.querySelector("#compose-subject").value,
      body: document.querySelector("#compose-body").value,
    }),
  }).then((response) => load_mailbox("sent"));
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#view-email").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";

  // Show the mailbox name

  let view = document.querySelector("#emails-view");
  view.innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  fetch("/emails/" + mailbox)
    .then((response) => response.json())
    .then((emails) => {
      emails.forEach((email) => {
        let div = document.createElement("div");
        div.innerHTML = `
    <div class="col-12 card border-dark">
       <div class="card-body">
          <h6 class="mb-0">${email["sender"]}</h6>
          <p class="mb-0">${email["subject"]}</p>
          <p class="mb-0">${email["timestamp"]}</p>
        </div>
    </div>
    `;

        div.addEventListener("click", () => view_email(email["id"],mailbox));
        view.appendChild(div);
      });
    });
}

function view_email(id, mailbox) {
  fetch("/emails/" + id)
    .then((response) => response.json())
    .then((email) => {

      // hide unhide views
      document.querySelector("#emails-view").style.display = "none";
      document.querySelector("#view-email").style.display = "block";
      document.querySelector("#compose-view").style.display = "none";

      const email_content = document.querySelector("#view-email");
      // create email view
      email_content.innerHTML =`
        From: <h4>${email['sender']}</h4>
        Recipient: <h4>${email['recipients']}</h4>
        Subject: <h4>${email['subject']}</h4>
        Message: <h4>${email['body']}</h4>
      `;

      // add an archive button only if the email is no a sent email
      if(mailbox!=="sent"){
        console.log("sent email");
        let button = document.createElement('button');
        button.innerHTML= !email['archived']? 'Archive':'Unarchive';
        button.addEventListener('click',function(){
  
          fetch('/emails/'+id, {
            method: 'PUT',
            body: JSON.stringify({
              archived: !email['archived']
            })
          })
            load_mailbox("inbox");
        })
        email_content.appendChild(button);
      }

      // allow to reply
      let button = document.createElement('button');
      button.innerHTML= `Reply`;
      button.addEventListener('click',function(){
        compose_email("inbox");
        let recep = document.querySelector("#compose-recipients");
        let subj=document.querySelector("#compose-subject");
        let bod=document.querySelector("#compose-body");
        let subject=email['subject'];
        let body=email['body'];
        let timestamp=email['timestamp'];
        let sender=email['sender'];
        recep.disabled=true;
        recep.value=email['sender'];
        if(subject.split(" ",1)!="Re:"){
          console.log(subject.split(" ",1));
          subject="Re: "+subject;
        }
        subj.value=subject;
        bod.value=`On: ${timestamp}, ${sender} Wrote: ${body}
        `;
      })
      email_content.appendChild(button);
    });

    // mark as read
    fetch('/emails/'+id, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
}
