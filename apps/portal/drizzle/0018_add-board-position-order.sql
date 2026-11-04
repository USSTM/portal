CREATE TABLE "board_position_order" (
	"board_position" text PRIMARY KEY NOT NULL,
	"display_order" integer NOT NULL,
	CONSTRAINT "board_position_order_display_order_unique" UNIQUE("display_order"),
	CONSTRAINT "board_position_order_position_trimmed" CHECK (length(btrim("board_position_order"."board_position")) > 0 and "board_position_order"."board_position" = btrim("board_position_order"."board_position"))
);
