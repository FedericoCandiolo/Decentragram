pragma solidity ^0.5.0;

contract Decentragram {
  string public name = "Decentragram";

  // Store Images
  uint public imageCount = 0;
  mapping(uint => Image) public images; //Diccionario de hash e imagen, Solidity genera sola la funcion images(id) para traer imagenes

  struct Image {
    uint id;
    string hash;
    string description;
    uint tipAmount;
    address payable author;
  }

  event ImageCreated( //Con el event despues podemos consumir el resultado de lo que se cargo a la blockchain
    uint id,
    string hash,
    string description,
    uint tipAmount,
    address payable author
  );

  event ImageTipped( //Con el event despues podemos consumir el resultado de lo que se cargo a la blockchain
    uint id,
    string hash,
    string description,
    uint tipAmount,
    address payable author
  );

  // Create Images
  function uploadImage(string memory _imgHash, string memory _description) public {
    //CONVENCION: uso _ para variables locales, no uso para variables de estado

    //Requisitos para que se corra
    require(bytes(_imgHash).length > 0);
    require(bytes(_description).length > 0);
    require(msg.sender != address(0x0));

    //Increment image id
    imageCount ++;

    //Add image to contract
    images[imageCount] = Image(imageCount, _imgHash, _description, 0, msg.sender); //Asi cargo el struct;
    //msg es una variable global que representa el mensaje global que viene con la transaccion de ethereum

    emit ImageCreated(imageCount, _imgHash, _description, 0, msg.sender);

  }

  // Tip Images
  function tipImageOwner(uint _id) public payable { //Para enviar cryptocurrency necesitamos la keyword payable
    require(_id > 0 && _id <= imageCount);
    
    //Fetch the image
    Image memory _image = images[_id];

    //Fetch the author
    address payable _author = _image.author;

    //Pay the author by sending them Ether
    _author.transfer(msg.value); //La cantidad de eth que se envia al llamar la funcion

    //Increment the tip amount
    _image.tipAmount = _image.tipAmount + msg.value;

    //Update the image
    images[_id] = _image;

    emit ImageTipped(_id, _image.hash, _image.description, _image.tipAmount, _author);
  }
  
}