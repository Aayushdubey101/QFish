FROM rust:slim-bookworm as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /app/target/release/rust-engine /app/rust-engine
EXPOSE 8080
CMD ["./rust-engine"]
