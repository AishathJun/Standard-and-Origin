CREATE TABLE `user` (
       `_id` BINARY(36) NOT NULL,
       `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       `login_id` VARCHAR (256),
       `password_hash` VARCHAR (256),
       PRIMARY KEY (`_id`),
       UNIQUE (`login_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
ALTER TABLE `user` ADD CONSTRAINT UNIQUE (`login_id`);

CREATE TABLE `picture` (
       `_id` BINARY(36) NOT NULL,
       `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       `last_updated` TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       `url` VARCHAR(2083),
       `base64` VARCHAR(3200),
       `data` BLOB,
       `label` VARCHAR(64),
       PRIMARY KEY (`_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
--ALTER TABLE picture ADD CONSTRAINT UNIQUE(label);

CREATE TABLE `category` (
       `_id` BINARY(36) NOT NULL,
       `name` VARCHAR(256),
       `pic` BINARY(36) NOT NULL,
       PRIMARY KEY (`_id`),
       FOREIGN KEY (`pic`) REFERENCES picture(`_id`),
       UNIQUE(`name`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;
ALTER TABLE category ADD CONSTRAINT UNIQUE(name);

CREATE TABLE `brand` (
       `_id` BINARY(36) NOT NULL,
       `name` VARCHAR(256),
       `origin` VARCHAR(32),
       PRIMARY KEY (`_id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;
--ALTER TABLE brand ADD CONSTRAINT UNIQUE(name);


Create TABLE `product` (
       `_id` BINARY(36) NOT NULL,
       `name` VARCHAR(256),
       `pic` BINARY(36) NOT NULL,
       `brand` BINARY(36) NOT NULL,
       `category` BINARY(36) NOT NULL,
       `cost` DOUBLE,
       `packaging` VARCHAR(2083),
       PRIMARY KEY (`_id`),
       FOREIGN KEY (`brand`) REFERENCES brand(`_id`),
       FOREIGN KEY (`category`) REFERENCES category(`_id`),
       FOREIGN KEY (`pic`) REFERENCES picture(`_id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE
  FUNCTION uuid_of(uuid BINARY(36))
  RETURNS VARCHAR(128)
  RETURN LOWER(CONCAT(
  SUBSTR(HEX(uuid), 1, 8), '-',
  SUBSTR(HEX(uuid), 9, 4), '-',
  SUBSTR(HEX(uuid), 13, 4), '-',
  SUBSTR(HEX(uuid), 17, 4), '-',
  SUBSTR(HEX(uuid), 21)
));
